import shlex, subprocess, os


def run_pdf2htmlEX(pdf_filename: str, use_cache: bool = True):
    pdf_path = os.path.join(os.getcwd(), f"storage/pdf/")
    html_path = os.path.join(os.getcwd(), "storage/temp/")
    html_filename = os.path.splitext(pdf_filename)[0] + ".html"

    is_pdf_exists = os.path.exists(pdf_path + pdf_filename)
    is_html_already_exists = os.path.exists(html_path + html_filename)

    if not is_pdf_exists:
        raise FileNotFoundError(f"fle PDF '{pdf_filename}' tidak ditemukan!")
    elif is_html_already_exists and use_cache:
        return

    # compose command
    command = f"""
        docker run --rm -v {pdf_path}:/pdf -w /pdf -v {html_path}:/home deaca982746e --process-outline 0 --embed-javascript 0 --dest-dir /home {pdf_filename}
    """
    command = command.replace("\\", "/")
    command = shlex.split(command)

    # eksekusi..
    subprocess.run(command)

    # kalau berhasil kita hapus file yg nggak kepakai
    files_to_delete = ["compatibility.min.js", "pdf2htmlEX.min.js"]
    for filename in files_to_delete:
        try:
            os.remove(html_path + filename)
        except (FileNotFoundError, PermissionError):
            pass