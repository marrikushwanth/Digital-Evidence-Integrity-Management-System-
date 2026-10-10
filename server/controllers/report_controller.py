import os
from flask import current_app, send_file, g, make_response, request
from datetime import datetime
from models.db import db
from models.case import Case
from models.report import Report
from utils.response import success_response, error_response
from utils.logger import log_audit, log_chain_of_custody
from services.report_service import generate_forensic_report_pdf, generate_template_report

def generate_report(case_id=None):
    template = 'case_summary'
    if request.is_json:
        template = request.json.get('template', 'case_summary')

    try:
        # Generate the specific report type via service
        pdf_bytes, report_type_title, safe_title = generate_template_report(template, case_id, g.user.id)
        
        if template == 'security_report':
            today_str = datetime.now().strftime('%Y-%m-%d')
            report_filename = f"DEIMS_Security_Report_{today_str}.pdf"
        else:
            report_filename = f"DEIMS_{safe_title}_{report_type_title}.pdf".replace(" ", "_")
            
        report_path = os.path.join(current_app.config['REPORTS_FOLDER'], report_filename)
        
        # Save to disk
        with open(report_path, 'wb') as f:
            f.write(pdf_bytes)
            
        if case_id:
            new_report = Report(
                case_id=case_id,
                generated_by=g.user.id,
                file_path=report_filename
            )
            db.session.add(new_report)
            db.session.commit()
            report_id_to_return = new_report.id
            log_audit('GENERATE_REPORT', f"Generated {report_type_title} for case {case_id}")
            log_chain_of_custody("SYSTEM", case_id, "Report Generated", status="SUCCESS")
        else:
            report_id_to_return = f"global_{report_filename}"
            log_audit('GENERATE_REPORT', f"Generated global {report_type_title}")
        
        return success_response('Report generated successfully', {
            'id': report_id_to_return,
            'file_name': report_filename
        }, status_code=201)
        
    except Exception as e:
        print(f"Failed to generate report: {e}")
        return error_response('Failed to generate report', status_code=500)

def download_report(report_id):
    if report_id.startswith('global_'):
        filename = report_id.replace('global_', '', 1)
        report_path = os.path.join(current_app.config['REPORTS_FOLDER'], filename)
        if not os.path.exists(report_path):
            return error_response('Global report file not found', status_code=404)
        log_audit('DOWNLOAD_REPORT', "Downloaded global report")
        return send_file(report_path, as_attachment=True, download_name=filename)
        
    report = db.session.get(Report, report_id)
    if not report:
        return error_response('Report not found', status_code=404)
        
    report_path = os.path.join(current_app.config['REPORTS_FOLDER'], report.file_path)
    if not os.path.exists(report_path):
        return error_response('Report file not found', status_code=404)
        
    log_audit('DOWNLOAD_REPORT', f"Downloaded report {report.id}")
    return send_file(report_path, as_attachment=True)

def get_reports():
    reports = Report.query.all()
    data = []
    for r in reports:
        data.append({
            'id': r.id,
            'case_id': r.case_id,
            'generated_by': r.generated_by,
            'generated_at': r.generated_at.isoformat(),
            'file_path': r.file_path
        })
    return success_response('Reports retrieved', data)

def generate_case_forensic_report(case_id):
    try:
        # Generate the PDF in memory
        pdf_bytes, case = generate_forensic_report_pdf(case_id, g.user.id)
        
        # Check permissions
        if g.user.role_ref.name not in ['Super Admin', 'Admin', 'Auditor']:
            if case.creator_id != g.user.id and getattr(case, 'investigator', '') != g.user.username:
                return error_response('Forbidden - You do not have access to this case', status_code=403)
                
        # Send file response
        response = make_response(pdf_bytes)
        response.headers['Content-Type'] = 'application/pdf'
        safe_title = "".join([c if c.isalnum() else "_" for c in case.title])
        filename = f"DEIMS_{safe_title}_Forensic_Report.pdf"
        response.headers['Content-Disposition'] = f'attachment; filename={filename}'
        
        log_audit('GENERATE_FORENSIC_REPORT', f"Generated Automated Forensic PDF Report for case {case.id}")
        return response
    except ValueError as ve:
        return error_response(str(ve), status_code=404)
    except Exception as e:
        current_app.logger.error(f"Forensic Report Error: {e}")
        return error_response('Failed to generate forensic report', status_code=500)
