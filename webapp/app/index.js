import { BinaryImageConverter, ColorImageConverter } from 'vtracer';

let runner;
const canvas = document.getElementById('frame');
const ctx = canvas.getContext('2d');
const svg = document.getElementById('svg');
const img = new Image();
const progress = document.getElementById('progressbar');
const progressregion = document.getElementById('progressregion');
let mode = 'spline', clustering_mode = 'color';

// Hide canas and svg on load
canvas.style.display = 'none';
svg.style.display = 'none';

// Paste from clipboard
document.addEventListener('paste', function (e) {
	if (e.clipboardData) {
		var items = e.clipboardData.items;
		if (!items) return;

		//access data directly
		for (var i = 0; i < items.length; i++) {
			if (items[i].type.indexOf("image") !== -1) {
				//image
				var blob = items[i].getAsFile();
				var URLObj = window.URL || window.webkitURL;
				var source = URLObj.createObjectURL(blob);
				setSourceAndRestart(source);
			}
		}
		e.preventDefault();
	}
});

// Download as SVG
document.getElementById('export').addEventListener('click', function (e) {
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], {type: 'octet/stream'}),
    url = window.URL.createObjectURL(blob);

    this.href = url;
    this.target = '_blank';

    this.download = 'export-' + new Date().toISOString().slice(0, 19).replace(/:/g, '').replace('T', ' ') + '.svg';
});

// Function to load a given config WITHOUT restarting
function loadConfig(config) {
	mode = config.mode;
	clustering_mode = config.clustering_mode;

	globalcorner = config.corner_threshold;
	document.getElementById('cornervalue').innerHTML = globalcorner;
	document.getElementById('corner').value = globalcorner;
	
	globallength = config.length_threshold;
	document.getElementById('lengthvalue').innerHTML = globallength;
	document.getElementById('length').value = globallength;
	
	globalsplice = config.splice_threshold;
	document.getElementById('splicevalue').innerHTML = globalsplice;
	document.getElementById('splice').value = globalsplice;

	globalfilterspeckle = config.filter_speckle;
	document.getElementById('filterspecklevalue').innerHTML = globalfilterspeckle;
	document.getElementById('filterspeckle').value = globalfilterspeckle;

	globalcolorprecision = config.color_precision;
	document.getElementById('colorprecisionvalue').innerHTML = globalcolorprecision;
	document.getElementById('colorprecision').value = globalcolorprecision;

	globallayerdifference = config.layer_difference;
	document.getElementById('layerdifferencevalue').innerHTML = globallayerdifference;
	document.getElementById('layerdifference').value = globallayerdifference;

}

// Upload button
var imageSelect = document.getElementById('imageSelect'),
imageInput = document.getElementById('imageInput');  
imageSelect.addEventListener('click', function (e) {
    imageInput.click();
    e.preventDefault();
});

imageInput.addEventListener('change', function (e) {
    setSourceAndRestart(this.files[0]);
});

// Drag-n-Drop
var drop = document.getElementById('drop');
var droptext = document.getElementById('droptext');
drop.addEventListener('dragenter', function (e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    droptext.classList.add('hovering');
    return false;
});

drop.addEventListener('dragleave', function (e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    droptext.classList.remove('hovering');
    return false;
});

drop.addEventListener('dragover', function (e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    droptext.classList.add('hovering');
    return false;
});

drop.addEventListener('drop', function (e) {
    if (e.preventDefault) e.preventDefault();
    droptext.classList.remove('hovering');
    setSourceAndRestart(e.dataTransfer.files[0]);
    return false;
});

// Get Input from UI controls
var globalcorner = parseInt(document.getElementById('corner').value),
    globallength = parseFloat(document.getElementById('length').value),
    globalsplice = parseInt(document.getElementById('splice').value),
    globalfilterspeckle = parseInt(document.getElementById('filterspeckle').value),
    globalcolorprecision = parseInt(document.getElementById('colorprecision').value),
    globallayerdifference = parseInt(document.getElementById('layerdifference').value);

document.getElementById('none').addEventListener('click', function (e) {
    mode = 'none';
    restart();
}, false);

document.getElementById('polygon').addEventListener('click', function (e) {
    mode = 'polygon';
    restart();
}, false);

document.getElementById('spline').addEventListener('click', function (e) {
    mode = 'spline';
    restart();
}, false);

document.getElementById('clustering-binary').addEventListener('click', function (e) {
    clustering_mode = 'binary';
    restart();
}, false);

document.getElementById('clustering-color').addEventListener('click', function (e) {
    clustering_mode = 'color';
    restart();
}, false);

document.getElementById('filterspeckle').addEventListener('change', function (e) {
    globalfilterspeckle = parseInt(this.value);
    document.getElementById('filterspecklevalue').innerHTML = this.value;
    restart();
});

document.getElementById('colorprecision').addEventListener('change', function (e) {
    globalcolorprecision = parseInt(this.value);
    document.getElementById('colorprecisionvalue').innerHTML = this.value;
    restart();
});

document.getElementById('layerdifference').addEventListener('change', function (e) {
    globallayerdifference = parseInt(this.value);
    document.getElementById('layerdifferencevalue').innerHTML = this.value;
    restart();
});

document.getElementById('corner').addEventListener('change', function (e) {
    globalcorner = parseInt(this.value);
    document.getElementById('cornervalue').innerHTML = this.value;
    restart();
});

document.getElementById('length').addEventListener('change', function (e) {
    globallength = parseFloat(this.value);
    document.getElementById('lengthvalue').innerHTML = this.value;
    restart();
});

document.getElementById('splice').addEventListener('change', function (e) {
    globalsplice = parseInt(this.value);
    document.getElementById('splicevalue').innerHTML = this.value;
    restart();
});

function setSourceAndRestart(source) {
    img.src = source instanceof File ? URL.createObjectURL(source) : source;
    img.onload = function () {
        svg.setAttribute('viewBox', `0 0 ${img.naturalWidth} ${img.naturalHeight}`);
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        restart();
    }
    // Show display
    canvas.style.display = 'block';
    svg.style.display = 'block';
    // Hide upload text
    droptext.style.display = 'none';
}

function restart() {
    document.getElementById('clustering-binary').classList.remove('selected');
    document.getElementById('clustering-color').classList.remove('selected');
    document.getElementById('clustering-' + clustering_mode).classList.add('selected');
    Array.from(document.getElementsByClassName('clustering-color-options')).forEach((el) => {
        el.style.display = clustering_mode == 'color' ? '' : 'none';
    });

    document.getElementById('none').classList.remove('selected');
    document.getElementById('polygon').classList.remove('selected');
    document.getElementById('spline').classList.remove('selected');
    document.getElementById(mode).classList.add('selected');
    Array.from(document.getElementsByClassName('spline-options')).forEach((el) => {
        el.style.display = mode == 'spline' ? '' : 'none';
    });

    if (!img.src) {
        return;
    }
    while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
    }
    ctx.clearRect(0, 0, canvas.width,canvas.height);
    ctx.drawImage(img, 0, 0);
    let converter_params = JSON.stringify({
        'canvas_id': canvas.id,
        'svg_id': svg.id,
        'mode': mode,
        'clustering_mode': clustering_mode,
        'corner_threshold': deg2rad(globalcorner),
        'length_threshold': globallength,
        'max_iterations': 10,
        'splice_threshold': deg2rad(globalsplice),
        'filter_speckle': globalfilterspeckle*globalfilterspeckle,
        'color_precision': 8-globalcolorprecision,
        'layer_difference': globallayerdifference,
    });
    if (runner) {
        runner.stop();
    }
    runner = new ConverterRunner(converter_params);
    progress.value = 0;
    progressregion.style.display = 'block';
    runner.run();
}

function deg2rad(deg) {
    return deg/180*3.141592654;
}

class ConverterRunner {
    constructor (converter_params) {
        this.converter =
            clustering_mode == 'color' ?
                ColorImageConverter.new_with_string(converter_params):
                BinaryImageConverter.new_with_string(converter_params);
        this.converter.init();
        this.stopped = false;
        if (clustering_mode == 'binary') {
            svg.style.background = '#000';
            canvas.style.display = 'none';
        } else {
            svg.style.background = '';
            canvas.style.display = '';
        }
        canvas.style.opacity = '';
    }

    run () {
        const This = this;
        setTimeout(function tick () {
            if (!This.stopped) {
                let done = false;
                const startTick = performance.now();
                while (!(done = This.converter.tick()) &&
                    performance.now() - startTick < 25) {
                }
                progress.value = This.converter.progress();
                if (progress.value >= 50) {
                    canvas.style.display = 'none';
                } else {
                    canvas.style.opacity = (50 - progress.value) / 25;
                }
                if (progress.value >= progress.max) {
                    progressregion.style.display = 'none';
                    progress.value = 0;
                }
                if (!done) {
                    setTimeout(tick, 1);
                }
            }
        }, 1);
    }

    stop () {
        this.stopped = true;
    }
}