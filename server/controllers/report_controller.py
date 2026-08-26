import os
from flask import current_app, send_file, g
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from models.db import db
from models.case import Case
from models.report import Report
from utils.response import success_response, error_response
from utils.logger import log_audit, log_chain_of_custody

def generate_report(case_id):
    case = Case.query.get(case_id)
    if not case:
        return error_response('Case not found', status_code=404)
        
    report_filename = f"Report_Case_{case.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
    report_path = os.path.join(current_app.config['REPORTS_FOLDER'], report_filename)
    
    try:
        # Create PDF using ReportLab
        c = canvas.Canvas(report_path, pagesize=letter)
        width, height = letter
        
        c.setFont("Helvetica-Bold", 16)
        c.drawString(50, height - 50, "Digital Evidence Integrity Management System")
        c.drawString(50, height - 70, f"Case Report: {case.title}")
        
        c.setFont("Helvetica", 12)
        c.drawString(50, height - 100, f"Case ID: {case.id}")
        c.drawString(50, height - 120, f"Status: {case.status}")
        c.drawString(50, height - 140, f"Description: {case.description}")
        c.drawString(50, height - 160, f"Created At: {case.created_at}")
        
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, height - 200, "Evidence Details")
        
        y_position = height - 230
        c.setFont("Helvetica", 10)
        
        for ev in case.evidence:
            if y_position < 100:
                c.showPage()
                y_position = height - 50
                
            c.drawString(50, y_position, f"Evidence ID: {ev.id}")
            y_position -= 15
            c.drawString(50, y_position, f"Original Name: {ev.original_name}")
            y_position -= 15
            c.drawString(50, y_position, f"SHA-256 Hash: {ev.file_hash}")
            y_position -= 15
            c.drawString(50, y_position, f"Uploaded By: {ev.uploader.username} on {ev.uploaded_at}")
            y_position -= 30
            
        c.save()
        
        new_report = Report(
            case_id=case.id,
            generated_by=g.user.id,
            file_path=report_filename
        )
        db.session.add(new_report)
        db.session.commit()
        
        log_audit('GENERATE_REPORT', f"Generated report for case {case.id}")
        log_chain_of_custody("SYSTEM", case.id, "Report Generated", status="SUCCESS")
        
        return success_response('Report generated successfully', {
            'id': new_report.id,
            'file_name': report_filename
        }, status_code=201)
        
    except Exception as e:
        print(f"Failed to generate report: {e}")
        return error_response('Failed to generate report', status_code=500)

def download_report(report_id):
    report = Report.query.get(report_id)
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
