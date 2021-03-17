class FramePlayer {
    constructor(el) {
        this.images = ["/images/0.jpg", "/images/1.jpg", "/images/2.jpg", "/images/3.jpg", "/images/4.jpg", "/images/5.jpg", "/images/6.jpg"];
        this.frames = [];
        this.framewidth = 128;
        this.frameheight = 72;
        this.fps = 10;

        this.divCont = document.getElementById(el);
        this.elem = el;
        this.paused = false;
        this.currentFrame = 0;
        this.startFrame = 0;

        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        this.divCont.appendChild(this.canvas);

        this.createControlBar();

        var self = this;
        this.divCont.addEventListener('click', function () {
            self.togglePlayer();
        }, false);
    }

    render(player) {
        var now;
        var then = Date.now();
        var interval = 1000 / player.fps;
        var delta;
        var videoFramesNum = player.frames.length - 1;

        var processFrame = function () {
            now = Date.now();
            delta = now - then;

            if (delta > interval) {
                then = now - (delta % interval);

                if (!player.paused) {
                    player.currentFrame += 1

                    if (player.currentFrame >= videoFramesNum) {
                        player.currentFrame = 0;
                        player.pause();

                        player.divCont.dispatchEvent(new Event('end'));
                    }

                    var progressbar = document.getElementById('progress-' + player.elem);
                    progressbar.value = player.currentFrame;

                    player.drawFrame(player);
                }
            }

            window.requestAnimationFrame(processFrame);
        };

        window.requestAnimationFrame(processFrame);
    }

    drawFrame(player) {
        var frame = player.frames[player.currentFrame];
        var img = new Image();
        img.onload = function () {
            player.context.drawImage(img, frame.x, frame.y, player.framewidth, player.frameheight, 0, 0, player.canvas.width, player.canvas.height);
        };
        img.src = frame.img;
    }

    play() {
        this.download(this.images);
        var self = this;
        this.divCont.addEventListener("downloadcomplete", function (e) {
            if (self.paused) {
                self.render(self);
                self.drawFrame(self);
            } else {
                self.render(self);
            }

            var progressbar = document.getElementById('progress-' + self.elem);
            progressbar.max = self.frames.length;
            self.divCont.dispatchEvent(new Event('play'));
        });
    }

    resume() {
        this.paused = false;
        this.updateToggleButton();

        this.divCont.dispatchEvent(new Event('resume'));
    }

    pause() {
        this.paused = true;
        this.updateToggleButton();

        this.divCont.dispatchEvent(new Event('pause'));
    }

    togglePlayer() {
        if (this.paused) {
            this.resume();
        }
        else {
            this.pause();
        }
    }

    gotoFrame(value) {
        this.currentFrame = this.startFrame = value;

        if (this.frames.length === 0) {
            this.play();
        } else {
            this.drawFrame(this);
        }

        var progressbar = document.getElementById('progress-' + player.elem);
        progressbar.value = player.currentFrame;

        this.pause();
    };

    createControlBar() {
        var self = this;
        var controlBar = document.createElement('div');
        controlBar.setAttribute('class', 'frame-controls');

        var toggleButton = document.createElement('button');
        toggleButton.setAttribute('id', 'toggle-btn-' + this.elem);
        toggleButton.setAttribute('class', 'toggle-btn');
        toggleButton.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            self.togglePlayer();
        }, false);


        var toggleButtonIcon = document.createElement('i');
        toggleButtonIcon.setAttribute('id', 'toggle-btn-icon-' + this.elem);
        toggleButton.appendChild(toggleButtonIcon);
        controlBar.appendChild(toggleButton);



        var progressbar = document.createElement('progress');
        progressbar.setAttribute('id', 'progress-' + this.elem);
        progressbar.setAttribute('class', 'fp-progress');
        progressbar.value = 0;
        progressbar.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            var clickedValue = e.offsetX * this.max / this.offsetWidth;

            self.gotoFrame(Math.floor(clickedValue));
        });
        controlBar.appendChild(progressbar);

        // Add control bar
        this.divCont.appendChild(controlBar);

        this.updateToggleButton();
    }

    updateToggleButton() {
        var toggleButtonIcon = document.getElementById('toggle-btn-icon-' + this.elem)

        if (this.paused) {
            toggleButtonIcon.setAttribute('class', 'fa  fa-play');
        }
        else {
            toggleButtonIcon.setAttribute('class', 'fa  fa-pause');
        }
    }




    /*Utils*/

    parseJPG(data) {

        for (var i = 0; i < 5; i++) {
            for (var j = 0; j < 5; j++) {
                var frameinfo = {
                    img: URL.createObjectURL(data), //can be much more efficient
                    x: this.framewidth * j,
                    y: this.frameheight * i
                };

                this.frames.push(frameinfo);
            }
        }
    };

    async download(images) {
        var t0 = performance.now();

        for (var i = 0; i < images.length; i++) {
            var result = await this.downloadSingleImage(images[i]);
            if (result) {
                this.parseJPG(result);
            }
        }

        var t1 = performance.now();

        this.divCont.dispatchEvent(new CustomEvent('downloadcomplete', {
            detail: (t1 - t0)
        }));
    }

    downloadSingleImage(url) {
        return new Promise(function (resolve, reject) {
            var request = new XMLHttpRequest();
            if (request) {
                request.open('GET', url, true);
                request.responseType = 'blob';
                request.setRequestHeader('Content-Type', 'image/jpeg;charset=UTF-8');
                request.send(null);

                if (typeof (request.onload) !== undefined) {
                    request.onload = function () {
                        resolve(this.response)
                        request = null;
                    };
                } else {
                    request.onreadystatechange = function () {
                        if (request.readyState === 4) {
                            resolve(this.response)
                            request = null;
                        }
                    };
                }
            } else {
                reject("Download file failed");
            }
        });
    }

    on(eventname, callback) {
        this.divCont.addEventListener(eventname, function (e) {
            if (e.detail) {
                callback(e.detail);
            }
            else {
                callback();
            }
        });
    }
}