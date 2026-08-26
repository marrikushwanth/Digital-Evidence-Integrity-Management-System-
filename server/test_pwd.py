import pymysql

passwords = ['', 'root', 'password', 'admin', '123456', '12345678', 'mariadb', 'mysql']
success = False

for p in passwords:
    try:
        print(f"Trying password: '{p}'")
        conn = pymysql.connect(host='127.0.0.1', user='root', password=p)
        print(f"SUCCESS with password: '{p}'")
        conn.close()
        success = True
        break
    except Exception as e:
        print(f"Failed: {e}")

if not success:
    print("ALL PASSWORDS FAILED.")
