// Wait for DOM content to load
document.addEventListener('DOMContentLoaded', () => {

    // --- Smooth Scrolling (Lenis) ---
    if (typeof Lenis !== 'undefined') {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        // Optional: integrate with GSAP ScrollTrigger
        if (typeof ScrollTrigger !== 'undefined') {
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add((time) => {
                lenis.raf(time * 1000);
            });
            gsap.ticker.lagSmoothing(0);
        }
    }

    // --- Preloader Logic ---
    const preloader = document.getElementById('preloader');
    const counter = document.getElementById('preloader-counter');
    const bar = document.getElementById('preloader-bar');

    if (preloader && counter && bar) {
        let count = 0;
        const updateCounter = () => {
            count += Math.floor(Math.random() * 10) + 1;
            if (count > 100) count = 100;

            counter.textContent = count;
            bar.style.width = count + '%';

            if (count < 100) {
                setTimeout(updateCounter, Math.random() * 50 + 20);
            } else {
                // Loading complete
                setTimeout(() => {
                    gsap.to(preloader, {
                        yPercent: -100,
                        duration: 1,
                        ease: "power4.inOut",
                        onComplete: () => {
                            preloader.style.display = 'none';
                            initAnimations();
                        }
                    });
                }, 500);
            }
        };

        updateCounter();
    } else {
        // Fallback if preloader elements don't exist
        setTimeout(initAnimations, 100);
    }

    // --- Custom Cursor & Magnetic Effect ---
    const cursorDot = document.getElementById('cursor-dot');
    const cursorRing = document.getElementById('cursor-ring');
    const magnetics = document.querySelectorAll('.magnetic');

    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;

    if (cursorDot && cursorRing) {
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            // Immediate dot update
            cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
        });

        // Smooth ring follow
        const renderCursor = () => {
            ringX += (mouseX - ringX) * 0.15;
            ringY += (mouseY - ringY) * 0.15;
            cursorRing.style.transform = `translate(${ringX}px, ${ringY}px)`;
            requestAnimationFrame(renderCursor);
        };
        renderCursor();

        // Hover effects on magnetic items
        magnetics.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorRing.classList.add('active');
                cursorDot.style.opacity = 0;
            });

            el.addEventListener('mouseleave', () => {
                cursorRing.classList.remove('active');
                cursorDot.style.opacity = 1;
                gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "power3.out" });
            });

            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const relX = e.clientX - rect.left - rect.width / 2;
                const relY = e.clientY - rect.top - rect.height / 2;

                // Magnetic pull
                gsap.to(el, {
                    x: relX * 0.3,
                    y: relY * 0.3,
                    duration: 0.3,
                    ease: "power2.out"
                });
            });
        });

        // Interactive elements that just need cursor change
        document.querySelectorAll('a, button, input, textarea').forEach(el => {
            if (!el.classList.contains('magnetic')) {
                el.addEventListener('mouseenter', () => cursorRing.classList.add('active'));
                el.addEventListener('mouseleave', () => cursorRing.classList.remove('active'));
            }
        });
    }

    // --- Abstract Canvas Background ---
    const canvas = document.getElementById('bg-canvas');

    if (canvas) {
        const ctx = canvas.getContext('2d');

        let width, height;
        let particles = [];

        const resizeCanvas = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * 2 + 0.1;
                this.speedX = Math.random() * 0.5 - 0.25;
                this.speedY = Math.random() * 0.5 - 0.25;
                this.color = Math.random() > 0.5 ? 'rgba(0, 240, 255, 0.2)' : 'rgba(0, 87, 255, 0.2)';
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                if (this.x > width) this.x = 0;
                else if (this.x < 0) this.x = width;

                if (this.y > height) this.y = 0;
                else if (this.y < 0) this.y = height;
            }

            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const initParticles = () => {
            particles = [];
            const particleCount = window.innerWidth < 768 ? 50 : 120;
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        };

        const animateParticles = () => {
            ctx.clearRect(0, 0, width, height);

            // Draw connections
            ctx.lineWidth = 0.5;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 100) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(0, 240, 255, ${0.1 - distance / 1000})`;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            particles.forEach(p => {
                p.update();
                p.draw();
            });

            requestAnimationFrame(animateParticles);
        };

        initParticles();
        animateParticles();
    }

    // --- Navigation & Mobile Menu ---
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');

    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // --- GSAP Animations (Called after preloader) ---
    function initAnimations() {
        gsap.registerPlugin(ScrollTrigger);

        // Parallax Background
        gsap.to('.animated-bg', {
            y: "15%",
            ease: "none",
            scrollTrigger: {
                trigger: document.body,
                start: "top top",
                end: "bottom top",
                scrub: true
            }
        });

        // Universal Scroll Reveals
        const revealElements = document.querySelectorAll('.hero-left, .hero-right, .section-title, .about-text p, .stat-item, .skill-card, .project-card, .contact-info, .contact-form');
        revealElements.forEach(el => {
            gsap.fromTo(el,
                { y: 30, opacity: 0 },
                {
                    y: 0, opacity: 1,
                    duration: 0.8,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: el,
                        start: "top 85%",
                        toggleActions: "play none none reverse"
                    }
                }
            );
        });

        // 3D Tilt Effect on cards
        if (typeof VanillaTilt !== 'undefined') {
            VanillaTilt.init(document.querySelectorAll(".project-card"), {
                max: 10,
                speed: 400,
                glare: false,
                easing: "cubic-bezier(.03,.98,.52,.99)",
                perspective: 1000,
                transition: true
            });
        }

        // Initialize Terminal Typewriter
        initTerminal();

        // Counter Animation
        const counters = document.querySelectorAll('.counter');
        counters.forEach(counter => {
            ScrollTrigger.create({
                trigger: counter,
                start: "top 80%",
                onEnter: () => {
                    const target = parseInt(counter.getAttribute('data-target'));
                    gsap.to(counter, {
                        innerHTML: target,
                        duration: 2,
                        snap: { innerHTML: 1 },
                        ease: "power2.out"
                    });
                },
                once: true
            });
        });
    }

    // --- Terminal Typing Effect ---
    function initTerminal() {
        const terminalBody = document.getElementById('terminal-body');
        const commands = [
            "whoami",
            "> Monish",
            "> Role: Cybersecurity Student & Web Dev",
            "cat education.txt",
            "> B.E. CSE (Cybersecurity)",
            "> Arunai Engineering College, 2023-2027",
            "echo $STATUS",
            "> Open to internships & collaborations",
            "./execute_future.sh",
            "> Loading..."
        ];

        let i = 0;
        let c = 0;
        let currentString = "";

        function typeWriter() {
            if (!terminalBody) return;
            if (i < commands.length) {
                if (c < commands[i].length) {
                    currentString += commands[i].charAt(c);

                    // Format output
                    let html = "";
                    for (let j = 0; j < i; j++) {
                        let prefix = commands[j].startsWith(">") ? "" : "<span style='color:#27C93F'>$ </span>";
                        let color = commands[j].startsWith(">") ? "#A0A0B0" : "#00F0FF";
                        html += `<div>${prefix}<span style='color:${color}'>${commands[j]}</span></div>`;
                    }

                    let prefix = commands[i].startsWith(">") ? "" : "<span style='color:#27C93F'>$ </span>";
                    let color = commands[i].startsWith(">") ? "#A0A0B0" : "#00F0FF";

                    terminalBody.innerHTML = html + `<div>${prefix}<span style='color:${color}'>${currentString}</span><span style='animation: blink 1s step-end infinite;'>_</span></div>`;

                    c++;
                    setTimeout(typeWriter, Math.random() * 50 + 20);
                } else {
                    currentString = "";
                    c = 0;
                    i++;
                    setTimeout(typeWriter, 500);
                }
            } else {
                // Done
                terminalBody.innerHTML = terminalBody.innerHTML.replace("<span style='animation: blink 1s step-end infinite;'>_</span>", "");
                terminalBody.innerHTML += `<div><span style='color:#27C93F'>$ </span><span style='animation: blink 1s step-end infinite;'>_</span></div>`;
            }
        }

        // Start typing when terminal comes into view
        ScrollTrigger.create({
            trigger: ".terminal-widget",
            start: "top 80%",
            onEnter: () => {
                setTimeout(typeWriter, 500);
            },
            once: true
        });
    }

    // --- Form Handling ---
    const form = document.getElementById('contactForm');
    const successBanner = document.getElementById('form-success');
    const errorBanner = document.getElementById('form-error');

    // Set current year in footer
    const currentYearEl = document.getElementById('current-year');
    if (currentYearEl) currentYearEl.textContent = new Date().getFullYear();

    // Helper: hide both banners
    function hideFeedback() {
        if (successBanner) successBanner.classList.remove('visible');
        if (errorBanner) errorBanner.classList.remove('visible');
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = document.getElementById('submit-btn');
            const originalText = btn.innerHTML;

            // Hide any previous feedback
            hideFeedback();

            // UX: disable button + show spinner
            btn.innerHTML = '<i class="fas fa-spinner" style="animation: spin 1s linear infinite;"></i> Sending...';
            btn.disabled = true;

            // Collect form values
            const formData = new FormData(form);
            const name = formData.get('name');
            const email = formData.get('email');
            const subject = formData.get('subject');
            const message = formData.get('message');

            // Build message in the exact required format (plain text)
            const text = [
                '📩 Monish_Portfolio Contact Form',
                '=================================',
                '',
                `Name: ${name}`,
                `Email: ${email}`,
                `Subject: ${subject}`,
                `Message: ${message}`,
                '',
                '================================='
            ].join('\\n');

            const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
            const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

            try {
                const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: CHAT_ID,
                        text: text
                        // No parse_mode → plain text (avoids Markdown/HTML conflicts)
                    })
                });

                const result = await response.json();

                if (!response.ok || !result.ok) {
                    throw new Error(result.description || 'Telegram API error');
                }

                // ✅ Confirmed delivery — show success
                form.reset();
                if (successBanner) {
                    successBanner.classList.add('visible');
                    setTimeout(() => successBanner.classList.remove('visible'), 5000);
                }
            } catch (error) {
                // ❌ Network error or API rejection — show error
                console.error('Contact form error:', error);
                if (errorBanner) {
                    errorBanner.classList.add('visible');
                    setTimeout(() => errorBanner.classList.remove('visible'), 5000);
                }
            } finally {
                // Always restore button regardless of outcome
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }
});

// Add global styles for the loader spin
const style = document.createElement('style');
style.innerHTML = `
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
}
`;
document.head.appendChild(style);
