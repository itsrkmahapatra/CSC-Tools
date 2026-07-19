(function() {
    // UPI Configuration
    const upiId = "Q546877063@ybl";
    const payeeName = "Raj Kishor Mahapatra";

    function initWidget() {
        console.log("PromptForge UPI Widget Initializing...");
        
        // Create Widget Styles
        const style = document.createElement('style');
        style.innerHTML = `
            .upi-widget-btn {
                position: fixed;
                bottom: 24px;
                right: 24px;
                background: linear-gradient(135deg, #ef4444, #db2777);
                color: white;
                border: none;
                border-radius: 9999px;
                padding: 14px 28px;
                font-weight: 700;
                box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.4);
                cursor: pointer;
                z-index: 9999;
                display: flex;
                align-items: center;
                gap: 12px;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .upi-widget-btn:hover { 
                transform: translateY(-4px) scale(1.05);
                box-shadow: 0 20px 25px -5px rgba(239, 68, 68, 0.5);
            }
            .upi-widget-btn svg {
                animation: upiPulse 2s infinite;
            }
            @keyframes upiPulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.15); }
                100% { transform: scale(1); }
            }
            .upi-modal {
                display: none;
                position: fixed;
                inset: 0;
                background: rgba(15, 23, 42, 0.8);
                backdrop-filter: blur(12px);
                z-index: 10000;
                align-items: center;
                justify-content: center;
                padding: 20px;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .upi-modal-content {
                background: #0f172a;
                padding: 36px;
                border-radius: 28px;
                max-width: 420px;
                width: 100%;
                text-align: center;
                position: relative;
                border: 1px solid rgba(239, 68, 68, 0.2);
                box-shadow: 0 25px 50px -12px rgba(239, 68, 68, 0.15);
                animation: upiFadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @keyframes upiFadeUp {
                from { opacity: 0; transform: translateY(30px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .upi-close {
                position: absolute;
                top: 20px;
                right: 20px;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                cursor: pointer;
                color: #94a3b8;
                transition: all 0.2s;
                background: rgba(255, 255, 255, 0.05);
            }
            .upi-close:hover {
                color: white;
                background: rgba(239, 68, 68, 0.2);
            }
            .upi-input-group {
                position: relative;
                margin: 20px 0 12px 0;
            }
            .upi-input {
                width: 100%;
                padding: 18px;
                background: #020617;
                border: 2px solid #1e293b;
                border-radius: 16px;
                font-size: 24px;
                font-weight: 800;
                text-align: center;
                color: #ef4444;
                transition: border-color 0.2s;
                outline: none;
            }
            .upi-input:focus {
                border-color: #ef4444;
            }
            .upi-presets {
                display: flex;
                justify-content: center;
                gap: 8px;
                margin-bottom: 24px;
            }
            .upi-preset-btn {
                background: #1e293b;
                color: #cbd5e1;
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 9999px;
                padding: 8px 16px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }
            .upi-preset-btn:hover {
                background: rgba(239, 68, 68, 0.15);
                color: #fca5a5;
                border-color: rgba(239, 68, 68, 0.3);
            }
            .upi-preset-btn.active {
                background: linear-gradient(135deg, #ef4444, #db2777);
                color: white;
                border-color: transparent;
            }
            .upi-pay-btn {
                background: linear-gradient(135deg, #ef4444, #db2777);
                color: white;
                border: none;
                padding: 16px 32px;
                border-radius: 16px;
                font-weight: 700;
                font-size: 16px;
                width: 100%;
                cursor: pointer;
                transition: all 0.2s;
                box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
            }
            .upi-pay-btn:hover {
                transform: scale(1.02);
                box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
            }
            #upi-qr-container {
                margin-top: 24px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
            }
            #upi-qr-container img {
                border: 12px solid white;
                border-radius: 20px;
                background: white;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
            }
            .upi-info { 
                font-size: 13px; 
                color: #64748b; 
                margin-top: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
            }
        `;
        document.head.appendChild(style);

        // Create Widget Elements
        const widgetBtn = document.createElement('button');
        widgetBtn.className = 'upi-widget-btn';
        widgetBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
            Support Raj
        `;
        document.body.appendChild(widgetBtn);

        const modal = document.createElement('div');
        modal.className = 'upi-modal';
        modal.innerHTML = `
            <div class="upi-modal-content">
                <div class="upi-close">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </div>
                <div style="background: rgba(239, 68, 68, 0.1); width: 64px; height: 64px; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
                </div>
                <h2 style="color:white;margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px">Support Project</h2>
                <p style="color:#94a3b8;margin:8px 0 0;font-size:15px">Every contribution helps keep this tool active.</p>
                
                <div class="upi-input-group">
                    <input type="number" class="upi-input" placeholder="Amount (₹)" value="100">
                    <div style="position:absolute;top:-10px;left:20px;background:#0f172a;padding:0 8px;color:#ef4444;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px">Amount (INR)</div>
                </div>

                <div class="upi-presets">
                    <button class="upi-preset-btn" data-value="50">₹50</button>
                    <button class="upi-preset-btn active" data-value="100">₹100</button>
                    <button class="upi-preset-btn" data-value="200">₹200</button>
                    <button class="upi-preset-btn" data-value="500">₹500</button>
                </div>

                <button class="upi-pay-btn">Proceed to Pay</button>
                <div id="upi-qr-container"></div>
                
                <div class="upi-info">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    Secure UPI Transfer (Payee: Raj Kishor)
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const input = modal.querySelector('.upi-input');
        const payBtn = modal.querySelector('.upi-pay-btn');
        const qrContainer = modal.querySelector('#upi-qr-container');
        const closeBtn = modal.querySelector('.upi-close');
        const presets = modal.querySelectorAll('.upi-preset-btn');

        // Handle Preset Clicks
        presets.forEach(btn => {
            btn.onclick = () => {
                presets.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                input.value = btn.getAttribute('data-value');
            };
        });

        // Handle Input Change to match active presets
        input.oninput = () => {
            presets.forEach(btn => {
                if (btn.getAttribute('data-value') === input.value) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        };

        // Handle Open/Close
        widgetBtn.onclick = () => {
            modal.style.display = 'flex';
            qrContainer.innerHTML = '';
            payBtn.style.display = 'block';
            input.parentElement.style.display = 'block';
            modal.querySelector('.upi-presets').style.display = 'flex';
        };
        closeBtn.onclick = () => modal.style.display = 'none';
        window.onclick = (e) => { if(e.target == modal) modal.style.display = 'none'; };

        // Load QRCode Library if not already loaded
        if (typeof QRCode === 'undefined') {
            const script = document.createElement('script');
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
            document.head.appendChild(script);
        }

        // Handle Payment
        payBtn.onclick = () => {
            const cleanAmount = parseFloat(input.value);
            if (isNaN(cleanAmount) || cleanAmount <= 0) return alert("Please enter a valid amount");

            const amount = cleanAmount.toFixed(2);
            const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR`;
            
            // Detect Mobile
            const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

            if (/^upi:\/\/pay\?/.test(upiUri)) {
                if (isMobile) {
                    window.location.href = upiUri;
                } else {
                    // Show QR Code for Desktop
                    qrContainer.innerHTML = ' <p style="color:#94a3b8;font-size:14px;margin-bottom:10px">Scan QR with any UPI App</p> ';
                    const qrDiv = document.createElement('div');
                    qrContainer.appendChild(qrDiv);
                    
                    new QRCode(qrDiv, {
                        text: upiUri,
                        width: 180,
                        height: 180,
                        colorDark : "#000000",
                        colorLight : "#ffffff",
                        correctLevel : QRCode.CorrectLevel.H
                    });
                    
                    payBtn.style.display = 'none';
                    input.parentElement.style.display = 'none';
                    modal.querySelector('.upi-presets').style.display = 'none';

                    // Add back button
                    const backBtn = document.createElement('button');
                    backBtn.className = 'upi-info';
                    backBtn.style.cssText = "background:none;border:none;color:#ef4444;cursor:pointer;margin-top:15px;font-weight:600;text-decoration:underline";
                    backBtn.textContent = "Change Amount";
                    backBtn.onclick = () => {
                        qrContainer.innerHTML = '';
                        payBtn.style.display = 'block';
                        input.parentElement.style.display = 'block';
                        modal.querySelector('.upi-presets').style.display = 'flex';
                    };
                    qrContainer.appendChild(backBtn);
                }
            }
        };
        console.log("PromptForge UPI Widget Ready.");
    }

    // Delay widget initialization by 2 seconds to avoid Next.js hydration mismatch
    setTimeout(() => {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            initWidget();
        } else {
            window.addEventListener('load', initWidget);
        }
    }, 2000);
})();