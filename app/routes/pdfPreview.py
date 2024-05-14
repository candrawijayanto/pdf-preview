from app import app
from flask import render_template, request, send_from_directory
import os
from lib import run_pdf2htmlEX


@app.get("/")
def index():
    return render_template("pdfPreview.html")


@app.get("/pdf/<filename>")
def getPdf(filename: str):
    base_name = os.path.splitext(filename)[0]
    html_path = os.path.join(os.getcwd(), "storage/temp/")
    pdf_path = os.path.join(os.getcwd(), f"storage/pdf/")

    as_html = request.args.get("as_html", "1")
    print("as_html", as_html)
    import time
    time.sleep(3)

    if as_html == "1":
        try:
            import time
            start_time = time.time()

            run_pdf2htmlEX(filename)
            
            end_time = time.time()
            time_spend = end_time - start_time
            print("time_spent", time_spend, "s")
        except FileNotFoundError as e:
            print(e)
            return str(e), 404

        return send_from_directory(html_path, f"{base_name}.html", mimetype="text/html")
    else:
        return send_from_directory(
            pdf_path,
            filename,
            mimetype="application/pdf",
            download_name=filename,
            as_attachment=True,
        )
