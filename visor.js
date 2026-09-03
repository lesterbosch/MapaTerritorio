const URL =
"https://script.google.com/macros/s/AKfycbwEABkKEpSezvJ82on1MLBSkwXULYt12PKgbzD1ujdph9BhS8cL3oHrmJnO0tV66IOupQ/exec";
const colores = {
    rojo: "#ff0000",
    verde: "rgb(0, 170, 0)",
    amarillo: "#ffff00",
    azul: "#0080ff",
    gris: "#cccccc",
    blanco: "#ffffff"
};

const objetoSVG =
    document.getElementById("svgMapa");

const visor =
    document.getElementById("visor");

const capturaZoom =
    document.getElementById("capturaZoom");

const mapaTransformado =
    document.getElementById("mapaTransformado");

let svg = null;
let datosManzanas = [];

// ========================================
// CARGAR PLANO
// ========================================

objetoSVG.addEventListener("load", () => {

    console.log("EVENTO LOAD DEL SVG");

    svg = objetoSVG.contentDocument;

    console.log("DOCUMENTO SVG:", svg);

    if (svg) {
    console.log("PLANO SVG CARGADO CORRECTAMENTE");

    cargarColores();

    actualizarNombresCalles();
    activarClicManzanas();
}
    else {
        console.log("NO SE PUDO OBTENER EL DOCUMENTO SVG");
    }

});


// ========================================
// COLORES GOOGLE SHEETS
// ========================================

function cargarColores() {

    console.log("Consultando Google Sheets...");

    fetch(URL)
        .then(r => {

            console.log("HTTP:", r.status);

            if (!r.ok) {
                throw new Error("Error HTTP: " + r.status);
            }

            return r.json();
        })

        .then(datos => {

            console.log("DATOS RECIBIDOS:", datos);

            // Guardamos los datos de Sheets
            datosManzanas = Array.isArray(datos) ? datos : [];

            console.log(
                "MANZANAS CARGADAS:",
                datosManzanas.length
            );

            console.log(
                "PRIMERA MANZANA:",
                datosManzanas[0]
            );

            // ==================================
            // COLOREAR MANZANAS
            // ==================================

            datosManzanas.forEach(fila => {

                const id =
                    String(fila.manzana || "")
                        .trim()
                        .toUpperCase()
                        .replace(/\s+/g, "");

                if (!id) return;

                const manzana =
                    svg.getElementById(id);

                if (!manzana) {

                    console.log(
                        "NO EXISTE EN SVG:",
                        id
                    );

                    return;
                }

                const color =
                    fila.color || "#ffffff";

                manzana.style.fill = color;
            });

        })

        .catch(error => {

            console.error(
                "ERROR GOOGLE SHEETS:",
                error
            );

        });
}


// ========================================
// COLOREAR MANZANA
// ========================================

function colorearManzana(id, color) {

    if (!svg)
        return;

    const manzana =
        svg.getElementById(id);

    if (manzana)
        manzana.style.fill = color;

}


// ========================================
// ZOOM Y MOVIMIENTO
// ========================================

let zoom = 1;

let desplazamientoX = 0;
let desplazamientoY = 0;


// ========================================
// APLICAR TRANSFORMACIÓN
// ========================================

function aplicarTransformacion() {

    mapaTransformado.style.transform =
        `translate(${desplazamientoX}px, ${desplazamientoY}px) scale(${zoom})`;

}

// ========================================
// ZOOM CON RUEDA
// ========================================

capturaZoom.addEventListener(
    "wheel",
    function(e) {

        e.preventDefault();

        const rect =
            visor.getBoundingClientRect();

        // Cursor dentro del visor
        const mouseX =
            e.clientX - rect.left;

        const mouseY =
            e.clientY - rect.top;


        // Punto del mapa debajo del cursor
        const mapaX =
            (
                mouseX -
                desplazamientoX
            ) / zoom;

        const mapaY =
            (
                mouseY -
                desplazamientoY
            ) / zoom;


        // Nuevo zoom
        if (e.deltaY < 0) {

            zoom *= 1.15;

        } else {

            zoom /= 1.15;

        }


        // Límites
        zoom =
            Math.max(
                0.5,
                Math.min(10, zoom)
            );


        // Mantener el punto debajo
        // del cursor
        desplazamientoX =
            mouseX -
            mapaX * zoom;

        desplazamientoY =
            mouseY -
            mapaY * zoom;


        aplicarTransformacion();

    },
    { passive: false }
);


// ========================================
// MOUSE - ARRASTRAR
// ========================================

let arrastrando = false;

let inicioX = 0;
let inicioY = 0;


capturaZoom.addEventListener(
    "mousedown",
    function(e) {

        arrastrando = true;

        inicioX =
            e.clientX -
            desplazamientoX;

        inicioY =
            e.clientY -
            desplazamientoY;

    }
);


capturaZoom.addEventListener(
    "mousemove",
    function(e) {

        if (!arrastrando)
            return;

        desplazamientoX =
            e.clientX -
            inicioX;

        desplazamientoY =
            e.clientY -
            inicioY;

        aplicarTransformacion();

    }
);


capturaZoom.addEventListener(
    "mouseup",
    function() {

        arrastrando = false;

    }
);


capturaZoom.addEventListener(
    "mouseleave",
    function() {

        arrastrando = false;

    }
);


// ========================================
// TELÉFONO
// ========================================

let dedos = new Map();

let distanciaInicial = 0;

let zoomInicial = 1;

let centroInicialX = 0;
let centroInicialY = 0;

let mapaCentroX = 0;
let mapaCentroY = 0;


// ========================================
// TOUCH START
// ========================================

capturaZoom.addEventListener(
    "touchstart",
    function(e) {

        e.preventDefault();

        // Guardar los dedos
        dedos.clear();

        for (
            let i = 0;
            i < e.touches.length;
            i++
        ) {

            dedos.set(
                i,
                {
                    x: e.touches[i].clientX,
                    y: e.touches[i].clientY
                }
            );

        }


        // ==================================
        // UN DEDO = MOVER
        // ==================================

        if (e.touches.length === 1) {

            arrastrando = true;

            inicioX =
                e.touches[0].clientX -
                desplazamientoX;

            inicioY =
                e.touches[0].clientY -
                desplazamientoY;

        }


        // ==================================
        // DOS DEDOS = PREPARAR ZOOM
        // ==================================

        if (e.touches.length === 2) {

            arrastrando = false;

            const dedo1 =
                dedos.get(0);

            const dedo2 =
                dedos.get(1);


            // Distancia inicial
            distanciaInicial =
                distanciaEntreDedos(
                    dedo1,
                    dedo2
                );


            zoomInicial = zoom;


            // Centro inicial
            const rect =
                visor.getBoundingClientRect();

            centroInicialX =
                (
                    dedo1.x +
                    dedo2.x
                ) / 2 -
                rect.left;

            centroInicialY =
                (
                    dedo1.y +
                    dedo2.y
                ) / 2 -
                rect.top;


            // Punto del mapa debajo
            // del centro de los dedos
            mapaCentroX =
                (
                    centroInicialX -
                    desplazamientoX
                ) / zoom;

            mapaCentroY =
                (
                    centroInicialY -
                    desplazamientoY
                ) / zoom;

        }

    },
    { passive: false }
);


// ========================================
// TOUCH MOVE
// ========================================

capturaZoom.addEventListener(
    "touchmove",
    function(e) {

        e.preventDefault();


        // ==================================
        // UN DEDO = MOVER
        // ==================================

        if (
            e.touches.length === 1 &&
            arrastrando
        ) {

            desplazamientoX =
                e.touches[0].clientX -
                inicioX;

            desplazamientoY =
                e.touches[0].clientY -
                inicioY;

            aplicarTransformacion();

            return;
        }


        // ==================================
        // DOS DEDOS = ZOOM
        // ==================================

        if (e.touches.length === 2) {

            const dedo1 = {

                x: e.touches[0].clientX,

                y: e.touches[0].clientY

            };

            const dedo2 = {

                x: e.touches[1].clientX,

                y: e.touches[1].clientY

            };


            const distanciaActual =
                distanciaEntreDedos(
                    dedo1,
                    dedo2
                );


            if (distanciaInicial === 0)
                return;


            // Nuevo zoom
            zoom =
                zoomInicial *
                (
                    distanciaActual /
                    distanciaInicial
                );


            zoom =
                Math.max(
                    0.5,
                    Math.min(10, zoom)
                );


            // ==================================
            // CENTRO ACTUAL
            // ==================================

            const rect =
                visor.getBoundingClientRect();

            const centroActualX =
                (
                    dedo1.x +
                    dedo2.x
                ) / 2 -
                rect.left;

            const centroActualY =
                (
                    dedo1.y +
                    dedo2.y
                ) / 2 -
                rect.top;


            // ==================================
            // MANTENER EL MAPA DEBAJO
            // DEL CENTRO DE LOS DEDOS
            // ==================================

            desplazamientoX =
                centroActualX -
                mapaCentroX * zoom;

            desplazamientoY =
                centroActualY -
                mapaCentroY * zoom;


            aplicarTransformacion();

        }

    },
    { passive: false }
);


// ========================================
// TOUCH END
// ========================================

capturaZoom.addEventListener(
    "touchend",
    function(e) {

        if (e.touches.length === 0) {

            arrastrando = false;

            distanciaInicial = 0;

            dedos.clear();

        }


        // Si queda un dedo,
        // volver a permitir mover
        if (e.touches.length === 1) {

            arrastrando = true;

            inicioX =
                e.touches[0].clientX -
                desplazamientoX;

            inicioY =
                e.touches[0].clientY -
                desplazamientoY;

        }

    },
    { passive: false }
);


// ========================================
// DISTANCIA ENTRE DOS DEDOS
// ========================================

function distanciaEntreDedos(a, b) {

    const dx =
        b.x - a.x;

    const dy =
        b.y - a.y;

    return Math.sqrt(
        dx * dx +
        dy * dy
    );
}
// ========================================
// RECALCULAR POSICIÓN Y VISIBILIDAD DE CALLES
// ========================================

// ========================================
// MOSTRAR NOMBRES DE CALLES
// ========================================

function actualizarNombresCalles() {

    if (!svg) return;

    const elementosCalle =
        svg.querySelectorAll(".nombreCalle");

    console.log(
        "NOMBRES DE CALLES ENCONTRADOS:",
        elementosCalle.length
    );

    elementosCalle.forEach(elem => {

        // Mostrar el nombre exactamente
        // en la posición que tiene en el SVG
        elem.style.display = "";

        // Quitar cualquier transformación
        // agregada anteriormente por esta función
        elem.removeAttribute("transform");

    });
}



// ========================================
// MOSTRAR INFORMACIÓN
// ========================================

function mostrarInformacionManzana(nombre) {

    console.log("================================");
    console.log("MANZANA CLIC:", nombre);
    console.log("DATOS CARGADOS:", datosManzanas);
    console.log("CANTIDAD DE DATOS:", datosManzanas.length);
    console.log("================================");

    // ==================================
    // COMPROBAR QUE SHEETS CARGÓ
    // ==================================

    if (!datosManzanas.length) {

        console.log(
            "LOS DATOS DE GOOGLE SHEETS TODAVÍA NO ESTÁN CARGADOS"
        );

        return;
    }

    // ==================================
    // NORMALIZAR MANZANA DEL SVG
    // ==================================

    const manzanaClic =
        String(nombre || "")
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "");

    // ==================================
    // BUSCAR EN GOOGLE SHEETS
    // ==================================

   const dato =
    datosManzanas.find(fila => {

        if (!fila || !fila.manzana) {
            return false;
        }

        const manzanaPlanilla =
            String(fila.manzana)
                .trim()
                .toUpperCase()
                .replace(/\s+/g, "");

        return manzanaPlanilla === manzanaClic;
    });
    console.log("DATO ENCONTRADO:", dato);

    // ==================================
    // SI NO EXISTE
    // ==================================

    if (!dato) {

        console.log(
            "NO SE ENCONTRÓ LA MANZANA:",
            manzanaClic
        );

        return;
    }

    // ==================================
    // CREAR VENTANA
    // ==================================

    let ventana =
        document.getElementById("infoManzana");

    if (!ventana) {

        ventana =
            document.createElement("div");

        ventana.id = "infoManzana";

        document.body.appendChild(ventana);
    }

    // ==================================
    // MOSTRAR DATOS DE SHEETS
    // ==================================

    ventana.innerHTML = `

        <div class="cerrarInfo"
             onclick="cerrarInformacion()">
            ×
        </div>

        <h3>
            MANZANA ${dato.manzana}
        </h3>

        <p>
            <b>Responsable:</b><br>
            ${dato.responsable || "-"}
        </p>

        <p>
            <b>Fecha inicio:</b><br>
            ${dato.fechaInicio || "-"}
        </p>

        <p>
            <b>Última fecha:</b><br>
            ${dato.ultimaFecha || "-"}
        </p>

    `;
}


// ========================================
// CERRAR INFORMACIÓN
// ========================================

function cerrarInformacion() {

    const ventana =
        document.getElementById(
            "infoManzana"
        );

    if (ventana) {
        ventana.remove();
    }
}

// ========================================
// CLIC DIRECTO EN MANZANAS
// ========================================
function activarClicManzanas() {

    if (!svg) {
        console.log("SVG NO DISPONIBLE");
        return;
    }

    const manzanas =
        svg.querySelectorAll(
            "path[data-manzana]"
        );

    console.log(
        "MANZANAS PARA CLIC:",
        manzanas.length
    );

    manzanas.forEach(manzana => {

        manzana.style.cursor = "pointer";

        manzana.addEventListener(
            "click",
            function(e) {

                e.stopPropagation();

                const nombre =
                    manzana.getAttribute(
                        "data-manzana"
                    );

                console.log(
                    "MANZANA SELECCIONADA:",
                    nombre
                );

                // =========================
                // ESPERAR DATOS DE SHEETS
                // =========================

                if (datosManzanas.length === 0) {

                    console.log(
                        "LOS DATOS TODAVÍA NO ESTÁN CARGADOS"
                    );

                    return;
                }

                mostrarInformacionManzana(
                    nombre
                );

            }
        );

    });
}
// ========================================
// CLIC EN MANZANA
// ========================================

let clicX = 0;
let clicY = 0;

capturaZoom.addEventListener("mousedown", function(e) {

    clicX = e.clientX;
    clicY = e.clientY;

});


capturaZoom.addEventListener("mouseup", function(e) {

    const diferenciaX =
        Math.abs(e.clientX - clicX);

    const diferenciaY =
        Math.abs(e.clientY - clicY);

    // Si se movió, es un arrastre
    if (
        diferenciaX > 5 ||
        diferenciaY > 5
    ) {
        return;
    }

    detectarManzana(e.clientX, e.clientY);

});


// ========================================
// DETECTAR MANZANA
// ========================================

function detectarManzana(clientX, clientY) {

    if (!svg) return;

    const rect =
        objetoSVG.getBoundingClientRect();

    const x =
        (clientX - rect.left) /
        rect.width *
        svg.documentElement.viewBox.baseVal.width;

    const y =
        (clientY - rect.top) /
        rect.height *
        svg.documentElement.viewBox.baseVal.height;

    const elementos =
        svg.querySelectorAll(
            "path[data-manzana]"
        );

    for (const manzana of elementos) {

        const caja =
            manzana.getBBox();

        if (
            x >= caja.x &&
            x <= caja.x + caja.width &&
            y >= caja.y &&
            y <= caja.y + caja.height
        ) {

            const nombre =
                manzana.getAttribute(
                    "data-manzana"
                );

            console.log(
                "MANZANA SELECCIONADA:",
                nombre
            );

            mostrarInformacionManzana(
                nombre
            );

            return;
        }
    }

    console.log(
        "NO SE ENCONTRÓ MANZANA"
    );
}
