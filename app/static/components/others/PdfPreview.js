class PdfPreview {
    #isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    constructor() {
        // Singleton Class
        const pdfModal = document.getElementById('page-container');
        const contextMenu = document.getElementById('context-menu-copy');
        if (pdfModal || contextMenu) throw new Error("PdfPreview already instantiated before!");

        const div = document.createElement('div');
        div.innerHTML = `
            <div class="pdf-modal">
                <div class="pdf-modal-content">
                    <div class="preview-bar">
                        <button class="img-back"">
                            <i class="gg-arrow-left"></i>
                        </button>
                        <img class="file" src="static/image/icon/file/file_preview.svg">
                        <p style="margin-top: 4px; color: whitesmoke;" pdf-label>Pdf Label</p>
                        <button class="img-download ml-auto">
                            <i class="gg-software-download"></i>
                        </button>
                    </div>
                    <div class="preview-content">
                        <div class="page-container" id="page-container">
                        </div>
                        <div class="loader" style="display: none;"></div>
                        <div class="pdf-error d-none">
                            <i class="gg-danger"></i>
                            <p>Gagal memuat PDF!</p>
                        </div>
                    </div>
                    <div class="preview-control">
                        <div class="img-control">
                            <button class="btn btn-default btn-control" btnDownScale>
                                <i class="gg-zoom-out"></i>
                            </button>
                            <button class="btn btn-default btn-control" btnRotate>
                                <i class="gg-redo"></i>
                            </button>
                            <button class="btn btn-default btn-control" btnReset>
                                <i class="gg-space-between"></i>
                            </button>
                            <button class="btn btn-default btn-control" btnUpScale>
                                <i class="gg-zoom-in"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.element = div.firstElementChild;
        document.body.appendChild(this.element);

        div.innerHTML = `
            <div class="context-menu">
                <div class="context-menu-item" id="context-menu-copy">
                    <p>Copy</p>
                </div>
            </div>
        `;
        this.contextMenu = div.firstElementChild;
        document.body.appendChild(this.contextMenu);

        this.#initConstructor();
    }

    #initConstructor() {
        // define fragments 
        const self = this.element;
        this.btnClose = self.querySelector('button.img-back');
        this.btnDownload = self.querySelector('button.img-download');
        this.pageContainer = self.querySelector('#page-container');
        this.loader = self.querySelector("div.loader");
        this.error = self.querySelector("div.pdf-error");
        this.btnDownScale = self.querySelector('[btnDownScale]');
        this.btnRotate = self.querySelector('[btnRotate]');
        this.btnReset = self.querySelector('[btnReset]');
        this.btnUpScale = self.querySelector('[btnUpScale');

        // listener
        this.btnClose.onclick = e => { this.hide(); };

        // PDF Control
        this.btnDownScale.onclick = e => { this.scalePdf(0); };
        this.btnReset.onclick = e => { this.fitPdf(); };
        this.btnUpScale.onclick = e => { this.scalePdf(1); };
        this.btnRotate.onclick = e => {
            this.pageContainer.style.width = '100%';
            this.element.querySelectorAll('[data-page-no]').forEach(e => {
                const rotateRegex = e.style.transform.match(/rotate\((.*?)\)/);
                const currRotate = rotateRegex ? parseFloat(rotateRegex[1]) : 0;

                e.style.transform = `rotate(${(currRotate + 90) % 360}deg)`;
            })
        }
    }

    #initBeforePdf() {
        this.show()
        this.showLoading();
        this.btnClose.disabled = true;

        // hapus control & context-menu listener
        this.element.querySelectorAll('.btn-control').forEach(btn => {
            btn.disabled = true;
        })
        this.btnDownload.onclick = e => { alert("Maaf file tidak bisa di-unduh!"); };

        if (!this.#isMobileDevice) {
            this.pageContainer.oncontextmenu = e => { return e.preventDefault() };
            this.element.oncontextmenu = e => { return e.preventDefault(); };
        }
    }

    #initAfterPdf() {
        // enable button control
        this.element.querySelectorAll('button').forEach(btn => {
            btn.disabled = false;
        })

        // PDF Viewer
        this.showPage();
        this.viewer = new pdf2htmlEX.Viewer({});
        pdf2htmlEX.defaultViewer = this.viewer;

        // HTML restriction
        this.element.querySelectorAll("img").forEach(img => {
            img.oncontextmenu = e => { return e.preventDefault(); };
            img.ondragstart = e => { return e.preventDefault(); };
        });

        // Event Listener for window ContextMenu Event - When Right Click is clicked (only on desktop)
        if (!this.#isMobileDevice) {
            this.pageContainer.oncontextmenu = event => {
                event.preventDefault();
                if (['DIV', 'SPAN', 'P'].includes(event.target.tagName)) {
                    // Select the text content of the clicked element
                    const selection = window.getSelection();
                    if (!selection.toString()) {
                        const range = document.createRange();
                        range.selectNodeContents(event.target);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }

                    this.contextMenu.style.display = 'block';
                    this.#positionMenu(event);
                }
            };

            this.element.oncontextmenu = e => { return e.preventDefault(); };

            // close context menu
            document.querySelector('div.pdf-modal').onclick = e => {
                this.contextMenu.style.display = 'none';
            };

            window.onkeyup = e => {
                if (e.key === "Escape") this.contextMenu.style.display = 'none';
            }

            // context-menu copy function
            document.getElementById('context-menu-copy').onclick = e => {
                const dummyTextArea = document.createElement('textarea');
                dummyTextArea.value = window.getSelection().toString();
                dummyTextArea.style.display = 'none';
                document.body.appendChild(dummyTextArea);

                dummyTextArea.select();
                // NOTE: harusnya pakai Clipboard-API, tapi malas :)
                document.execCommand('copy');
                document.body.removeChild(dummyTextArea);
                this.contextMenu.style.display = 'none';
            };
        }
    }

    #placeHtmlPdf(doc) {
        let css = document.querySelector('style#pdf-css');
        if (css) css.remove();

        css = doc.querySelector('style:last-of-type');
        css.id = 'pdf-css';

        this.pageContainer.innerHTML = doc.getElementById('page-container').innerHTML;
        document.body.appendChild(css);

        this.#initAfterPdf();
        this.fitPdf();
    }

    #setDownloadListener(href) {
        if (!href) return;
        this.btnDownload.onclick = e => {
            const anchor = document.createElement('a');
            anchor.href = href;
            anchor.style.display = 'none';
            document.body.appendChild(anchor);
            anchor.click();
        };
    }

    setPdfFile(htmlLink, pdfLink) {
        this.#initBeforePdf();

        if (htmlLink instanceof Document) {
            this.#placeHtmlPdf(htmlLink);
            this.#setDownloadListener(pdfLink);
        }

        fetch(htmlLink)
            .then(response => {
                if (!response.ok) {
                    throw new Error(response.status + ' - ' + response.statusText);
                }
                return response.text();
            })
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                this.#placeHtmlPdf(doc);
                this.#setDownloadListener(pdfLink);
            })
            .catch(error => {
                this.btnClose.disabled = false;
                this.showError(String(error));
                console.error(error);
            });
    }

    /**
     * Scale the PDF viewer.
     * @param {number} value - The scaling type:
     *   - 0: scale down / zoom out the PDF
     *   - 1: scale up / zoom in the PDF
     * @throws {Error} Throws an error if the value is not 0 or 1.
     */
    scalePdf(value) {
        if (value === 0) {
            this.viewer.rescale(0.9, true);
        } else if (value === 1) {
            this.viewer.rescale(1.2, true);
        } else {
            throw new Error(`Invalid value: '${value}'. Can only be 0 or 1!`);
        }
    }

    /**
     * Automatically adjusts the PDF viewer to fit the content within the user's screen.
     */
    fitPdf() {
        // Reset PDF layout
        this.element.querySelectorAll('[data-page-no]').forEach(page => {
            page.style.transform = '';
        });
        this.pageContainer.style.width = 'auto';
        this.viewer.rescale(0, false);

        // Fit PDF to the user's screen
        const getLeft = () => this.pageContainer.getBoundingClientRect().left;
        let loopCount = 0;

        while (getLeft() < 28 && loopCount < 10) {
            this.viewer.rescale(0.9, true);
            loopCount++;
        }
    }

    set label(value) {
        this.element.querySelector('[pdf-label]').textContent = value;
    }

    show() {
        this.element.style.display = 'block';
    }

    hide() {
        this.element.style.display = 'none';
    }

    showLoading() {
        this.#hidePage();
        this.#hideError();

        this.loader.parentElement.classList.add('flex-justify-align-center');
        this.loader.style.display = 'block';
    }

    showError(message = "Gagal memuat PDF!") {
        this.#hidePage();
        this.#hideLoading();

        this.error.classList.remove('d-none');
        this.error.parentElement.classList.add('flex-justify-align-center');
        this.error.lastElementChild.textContent = message;
    }

    showPage() {
        this.#hideError();
        this.#hideLoading();

        this.pageContainer.style.display = 'block';
    }

    #hideLoading() {
        this.loader.parentElement.classList.remove('flex-justify-align-center');
        this.loader.style.display = 'none';
    }

    #hideError() {
        this.error.classList.add('d-none');
    }

    #hidePage() {
        this.pageContainer.style.display = 'none';
    }

    #getXandY(event) {
        if (event.pageX || event.pageY) {
            return {
                x: event.pageX,
                y: event.pageY
            };
        } else if (event.clientX || event.clientY) {
            return {
                x: event.clientX +
                    document.body.scrollLeft +
                    document.documentElement.scrollLeft,
                y: event.clientY +
                    document.body.scrollTop +
                    document.documentElement.scrollTop
            };
        } else {
            return {
                x: 0,
                y: 0
            };
        }
    }

    #positionMenu(event) {
        let clickCoords = this.#getXandY(event);
        let clickCoordsX = clickCoords.x;
        let clickCoordsY = clickCoords.y;

        let menuWidth = this.contextMenu.offsetWidth + 4;
        let menuHeight = this.contextMenu.offsetHeight + 4;

        let windowWidth = window.innerWidth;
        let windowHeight = window.innerHeight;

        if (windowWidth - clickCoordsX < menuWidth) {
            this.contextMenu.style.left = windowWidth - menuWidth + "px";
        } else {
            this.contextMenu.style.left = clickCoordsX + "px";
        }

        if (windowHeight - clickCoordsY < menuHeight) {
            this.contextMenu.style.top = windowHeight - menuHeight + "px";
        } else {
            this.contextMenu.style.top = clickCoordsY + "px";
        }
    }
}