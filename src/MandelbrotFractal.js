import { useRef, useEffect, useState } from "react";

const MandelbrotCanvas = () => {
    const canvasRef = useRef();
    const [zoom, setZoom] = useState(200);
    const [offset, setOffset] = useState({ x: -0.5, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [lastPos, setLastPos] = useState(null);
    const [maxIter, setMaxIter] = useState(100);
    const [scale, setScale] = useState(0.5);
    const [showPanel, setShowPanel] = useState(true);
    const [showInstructions, setShowInstructions] = useState(false);
    let hideTimeout = null;

    useEffect(() => {
        hideTimeout = setTimeout(() => setShowPanel(false), 5000);
        return () => clearTimeout(hideTimeout);
    }, []);



    function getHeatmapColor(t) {
        const r = Math.floor(255 * Math.pow(t, 3));
        const g = Math.floor(255 * Math.pow(t, 1.5));
        const b = Math.floor(255 * t);
        return [r, g, b];
    }


    const renderFractal = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;

        const w = Math.floor(canvas.width * scale);
        const h = Math.floor(canvas.height * scale);

        const imageData = ctx.createImageData(w, h);
        const data = imageData.data;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let zx = (x - w / 2) / (zoom * scale) + offset.x;
                let zy = (y - h / 2) / (zoom * scale) + offset.y;
                let a = zx, b = zy, i = 0;

                while (a * a + b * b <= 4 && i < maxIter) {
                    const aa = a * a - b * b + zx;
                    const bb = 2 * a * b + zy;
                    a = aa;
                    b = bb;
                    i++;
                }

                const pixelIndex = (y * w + x) * 4;
                if (i === maxIter) {
                    data[pixelIndex] = 0;
                    data[pixelIndex + 1] = 0;
                    data[pixelIndex + 2] = 0;
                } else {
                    const t = i / maxIter;
                    const [r, g, b] = getHeatmapColor(t);
                    data[pixelIndex] = r;
                    data[pixelIndex + 1] = g;
                    data[pixelIndex + 2] = b;
                }

                data[pixelIndex + 3] = 255;
            }
        }

        createImageBitmap(imageData).then((bitmap) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        });
    };



    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            renderFractal();
        };

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();

        return () => window.removeEventListener("resize", resizeCanvas);
    }, []);

    useEffect(() => {
        renderFractal();
    }, [zoom, offset, maxIter, scale]);


    const handleWheel = (e) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const mouseX = (e.clientX - rect.left) * dpr;
        const mouseY = (e.clientY - rect.top) * dpr;

        const xBefore = (mouseX - canvas.width / 2) / zoom + offset.x;
        const yBefore = (mouseY - canvas.height / 2) / zoom + offset.y;

        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = zoom * delta;

        const xAfter = (mouseX - canvas.width / 2) / newZoom + offset.x;
        const yAfter = (mouseY - canvas.height / 2) / newZoom + offset.y;

        setZoom(newZoom);
        setOffset({
            x: offset.x + (xBefore - xAfter),
            y: offset.y + (yBefore - yAfter),
        });

        setTimeout(renderFractal, 0);
    };

    const handleMouseDown = (e) => {
        setDragging(true);
        setMaxIter(30);
        setLastPos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
        setDragging(false);
        setLastPos(null);
        setMaxIter(100);
        renderFractal();
    };

    const handleMouseMove = (e) => {
        if (!dragging || !lastPos) return;
        const dx = (e.clientX - lastPos.x) / zoom;
        const dy = (e.clientY - lastPos.y) / zoom;
        setOffset((o) => ({ x: o.x - dx, y: o.y - dy }));
        setLastPos({ x: e.clientX, y: e.clientY });
    };


    const buttonStyle = {
        background: "rgba(0, 191, 255, 0.1)",
        border: "1px solid #00bfff",
        borderRadius: "8px",
        color: "#00dfff",
        padding: "6px 12px",
        fontWeight: "500",
        cursor: "pointer",
        transition: "all 0.3s ease",
    };

    return (
        <>
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: '20%',
                    height: '20%',
                    zIndex: 1,
                }}
                onMouseEnter={() => {
                    clearTimeout(hideTimeout);
                    setShowPanel(true);
                }}
            />


            <div
                style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    background: "rgba(15, 15, 30, 0.95)",
                    borderRadius: "16px",
                    padding: "16px 20px",
                    boxShadow: "0 0 18px rgba(0, 150, 255, 0.4)",
                    transition: "opacity 0.3s ease",
                    opacity: showPanel ? 1 : 0,
                    pointerEvents: showPanel ? "auto" : "none",
                    color: "#fff",
                    zIndex: 2,
                    fontFamily: "Segoe UI, sans-serif",
                    fontSize: "15px",
                    backdropFilter: "blur(6px)"
                }}
                onMouseLeave={() => {
                    clearTimeout(hideTimeout);
                    hideTimeout = setTimeout(() => setShowPanel(false), 3000);
                }}
            >
                <div style={{ marginBottom: 10 }}>
                    <strong>Quality: {(scale * 100).toFixed(0)}%</strong>
                    <input
                        type="range"
                        min="0.2"
                        max="1"
                        step="0.1"
                        value={scale}
                        onChange={(e) => setScale(parseFloat(e.target.value))}
                        style={{
                            width: 120,
                            marginLeft: 8,
                            accentColor: "#00bfff"
                        }}
                    />
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button style={buttonStyle} onClick={() => setZoom((z) => z * 1.5)}>Zoom In</button>
                    <button style={buttonStyle} onClick={() => {
                        setZoom(200);
                        setOffset({ x: -0.5, y: 0 });
                        setScale(0.5);
                    }}>Reset View</button>
                </div>
                <button style={buttonStyle} onClick={() => {
                    const canvas = canvasRef.current;
                    const url = canvas.toDataURL("image/png");
                    const link = document.createElement("a");
                    link.download = "mandelbrot.png";
                    link.href = url;
                    link.click();
                }}>Download PNG</button>

                <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button style={buttonStyle} onClick={() => setShowInstructions(!showInstructions)}>📘 Instructions</button>
                    <a href="https://github.com/yourusername/mandelbrot" target="_blank" rel="noopener noreferrer">
                        <button style={buttonStyle}>🌐 GitHub</button>
                    </a>
                    <a href="https://yourproject.site" target="_blank" rel="noopener noreferrer">
                        <button style={buttonStyle}>🔗 Project</button>
                    </a>
                </div>

                {showInstructions && (
                    <div style={{
                        marginTop: 12,
                        padding: 12,
                        background: "rgba(10, 20, 40, 0.8)",
                        border: "1px solid #00bfff",
                        borderRadius: "12px",
                        color: "#cceeff",
                        fontSize: "14px",
                        lineHeight: "1.6",
                        boxShadow: "inset 0 0 10px #002244",
                        fontFamily: "monospace",
                        maxWidth: 300
                    }}>
                        🔍 <strong style={{ color: "#fff" }}>Guide:</strong><br />
                        • jskjksj<br />
                        • sdfsdfsd<br />
                        • sdfsdfjhsdifuh<br />
                        • wuhfisdufhisduf<br />
                        • Quwuhfisdufhisduf
                    </div>
                )}


            </div>

            <canvas
                ref={canvasRef}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                style={{ width: "100vw", height: "100vh", display: "block", cursor: "grab" }}
            />
        </>
    );
};

export default MandelbrotCanvas;