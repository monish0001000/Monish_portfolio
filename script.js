import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import VanillaTilt from 'vanilla-tilt';
import Lenis from '@studio-freight/lenis';

// Wait for DOM content to load
document.addEventListener('DOMContentLoaded', () => {

    // Prevent browser from restoring previous scroll position which causes glitches
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    // --- Smooth Scrolling (Lenis) ---
    let lenis;
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
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
        // Stop Lenis initially during the preloader
        lenis.stop();
    }

    // --- Cinematic Preloader Sequence ---
    const preloader = document.getElementById('preloader');
    const appWrapper = document.getElementById('app-wrapper');
    const logoContainer = document.querySelector('.logo-container');

    const runBootSequence = () => {
        const tl = gsap.timeline();

        // Initial states
        gsap.set(appWrapper, { opacity: 0, y: 30 });
        gsap.set(logoContainer, { opacity: 0, scale: 1 });
        gsap.set(preloader, { opacity: 1, display: 'flex' });

        // Cinematic Zoom: Slowly scales the logo from 1.0 to 1.15 throughout the sequence
        tl.to(logoContainer, {
            scale: 1.15,
            duration: 4.0, // Spans the full sequence duration
            ease: "sine.inOut" // Smooth constant feel
        }, 0);

        tl.to(logoContainer, {
            opacity: 1,
            duration: 1.2,
            ease: "power2.inOut"
        }, 0)
        .to(preloader, {
            opacity: 0,
            duration: 1.5,
            ease: "power3.inOut",
            delay: 1.3, // Hold the logo visible (1.2 + 1.3 + 1.5 = 4s total)
            onComplete: () => {
                preloader.style.display = 'none';
            }
        }, "-=0.3")
        .to(appWrapper, {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: "power4.out",
            onStart: () => {
                initAnimations();
            },
            onComplete: () => {
                // Clear props except what's needed, but better to keep it clean
                gsap.set(appWrapper, { clearProps: "y" });
                
                // Finally allow scrolling
                document.body.classList.remove('no-scroll');
                
                // Refresh GSAP ScrollTrigger to recalculate positions correctly now that height is stable
                ScrollTrigger.refresh();
                
                // If using Lenis, tell it to resize/start
                if (lenis) {
                    lenis.start();
                }
            }
        }, "-=0.8");

        // --- Asset Preloading ---
        const criticalAssets = [
            './images/boot-logo.webp',
            './images/logo.png',
            './images/img.webp',
            './images/Homepage.webp'
        ];
        
        let loadedCount = 0;
        const totalAssets = criticalAssets.length;
        let preloadingFinished = false;

        const finishPreloading = () => {
            if (preloadingFinished) return;
            preloadingFinished = true;
            // The timeline continues automatically, but we ensure preloading is tracked.
        };

        criticalAssets.forEach(src => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                loadedCount++;
                if (loadedCount === totalAssets) finishPreloading();
            };
            img.onerror = () => {
                loadedCount++;
                if (loadedCount === totalAssets) finishPreloading();
            };
        });

        // 4-second safety timeout for preloading
        setTimeout(finishPreloading, 4000);
    };

    if (preloader && logoContainer) {
        runBootSequence();
    } else {
        // Fallback
        gsap.set(appWrapper, { opacity: 1, y: 0 });
        initAnimations();
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
            const particleCount = window.innerWidth < 768 ? 15 : 60; // Optimized for mobile
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

    // --- Nav Menu (Hamburger) ---
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');

    // --- Typewriter Effect ---
    const typewriterElement = document.querySelector('.typewrite');
    if (typewriterElement) {
        const words = JSON.parse(typewriterElement.getAttribute('data-words'));
        let wordIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        const type = () => {
            const currentWord = words[wordIndex];
            
            if (isDeleting) {
                charIndex--;
            } else {
                charIndex++;
            }

            typewriterElement.textContent = currentWord.substring(0, charIndex);

            let typeSpeed = isDeleting ? 30 : 60;

            if (!isDeleting && charIndex === currentWord.length) {
                typeSpeed = 1500; // Pause at end of word
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                typeSpeed = 300; // Pause before next word
            }

            setTimeout(type, typeSpeed);
        };

        type();
    }

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
            link.addEventListener('click', (e) => {
                e.preventDefault();
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                
                const targetId = link.getAttribute('href');
                if (targetId && targetId.startsWith('#')) {
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        if (typeof lenis !== 'undefined' && lenis) {
                            lenis.scrollTo(targetElement, {
                                offset: -80, // adjust for navbar height
                                duration: 1.5,
                                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                            });
                        } else {
                            // Fallback
                            const elementPosition = targetElement.getBoundingClientRect().top;
                            const offsetPosition = elementPosition + window.pageYOffset - 80;
                            window.scrollTo({
                                top: offsetPosition,
                                behavior: "smooth"
                            });
                        }
                    }
                }
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
        const revealElements = document.querySelectorAll('.section-title, .about-text p, .stat-item, .skill-card, .timeline-item, .project-card, .contact-info, .contact-form');
        
        // Initial hero animations (no scroll trigger needed since they are at the top)
        gsap.fromTo(['.hero-left', '.hero-right'],
            { y: 30, opacity: 0 },
            {
                y: 0, opacity: 1,
                duration: 1,
                delay: 0.2,
                stagger: 0.2,
                ease: "power3.out"
            }
        );
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

        // Timeline Line Growth Animation
        gsap.fromTo('.timeline-line', 
            { scaleY: 0 },
            {
                scaleY: 1,
                transformOrigin: "top",
                ease: "none",
                scrollTrigger: {
                    trigger: ".timeline",
                    start: "top 80%",
                    end: "bottom 20%",
                    scrub: true
                }
            }
        );

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
            if (!btn) return;

            const originalText = btn.innerHTML;

            try {
                // Hide any previous feedback
                hideFeedback();

                // UX: disable button + show spinner
                btn.innerHTML = '<i class="fas fa-spinner" style="animation: spin 1s linear infinite;"></i> Sending...';
                btn.disabled = true;

                // Collect form values
                const formData = new FormData(form);
                const name = formData.get('name') || 'Anonymous';
                const email = formData.get('email') || 'No Email';
                const subject = formData.get('subject') || 'No Subject';
                const message = formData.get('message') || 'No Message';

                // Build payload for secure backend
                const payload = { name, email, subject, message };

                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || `Server error: ${response.status}`);
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
                
                // Provide a more user-friendly message if it's a fetch failure (likely adblock or network)
                if (error.message.includes('Failed to fetch')) {
                    if (errorBanner) {
                        const span = errorBanner.querySelector('span');
                        if (span) span.textContent = 'Network error. Please check your internet or disable ad-blockers.';
                    }
                } else if (error.message.includes('configuration missing')) {
                    if (errorBanner) {
                        const span = errorBanner.querySelector('span');
                        if (span) span.textContent = 'Form configuration error. Please contact the site owner.';
                    }
                }

                if (errorBanner) {
                    errorBanner.classList.add('visible');
                    setTimeout(() => {
                        errorBanner.classList.remove('visible');
                        // Restore original error message for next attempt if we changed it
                        const span = errorBanner.querySelector('span');
                        if (span) span.textContent = 'Something went wrong. Please try again or email me directly.';
                    }, 6000);
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
