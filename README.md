**PDF Previewer**

This project aims to provide a responsive, in-browser PDF previewer that seamlessly functions across both mobile and desktop platforms. It offers essential controls for enhancing user experience, including zoom-in, zoom-out, PDF rotation, and the ability to fit the PDF document to the user's screen. Additionally, it features a text selection control, facilitating easy copying of text from the PDF.

**Motivation**

After exploring various solutions, such as the "pdf.js" library by Mozilla, I encountered challenges in implementing the text selection feature (even though they provide the easy example, hehe). As a result,
I opted for the pdf2htmlEX library to convert PDF files into HTML format, then display it on the modal and added some control.

To run this app we need:
  - Python installed with Flask framework (pip instal -U flask)
  - Docker and pdf2htmlEX docker image (docker pull pdf2htmlex/pdf2htmlex:0.18.8.rc2-master-20200820-ubuntu-20.04-x86_64)
  - Then just run the app (python main.py)