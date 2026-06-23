import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiCheckSquare, FiArrowRight, FiList, FiActivity, FiInbox, FiSliders, FiClock, FiSearch } from 'react-icons/fi';

const Landing = () => {
  const canvasRef = useRef(null);
  const { user } = useAuth();

  // Demo Widget States
  const [demoStatus, setDemoStatus] = useState('in-progress');
  const [demoPriority, setDemoPriority] = useState('high');
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionActive, setSessionActive] = useState(true);

  const allDemoTasks = [
    { id: 1, title: 'Write Auth Middleware', cat: 'Backend' },
    { id: 2, title: 'Design Glass Dashboard', cat: 'UI/UX' },
    { id: 3, title: 'Optimize WebGL Shader', cat: 'Graphics' }
  ];
  const filteredDemoTasks = allDemoTasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const cycleDemoStatus = () => {
    const order = ['pending', 'in-progress', 'completed'];
    const next = order[(order.indexOf(demoStatus) + 1) % order.length];
    setDemoStatus(next);
  };

  // WebGL Shader Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function syncSize() {
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }
    
    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(syncSize);
      resizeObserver.observe(canvas);
    }
    syncSize();

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fs = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

void main() {
    vec2 uv = v_texCoord;
    vec2 mouse = u_mouse / u_resolution;
    
    // Create a deep dark blue base
    vec3 color = vec3(0.04, 0.05, 0.08);
    
    // Add subtle sky blue glow based on mouse position
    float dist = distance(uv, mouse);
    float glow = 0.35 * exp(-dist * 4.0);
    color += vec3(0.0, 0.65, 1.0) * glow;
    
    // Add moving ambient light spots
    for(float i = 0.0; i < 3.0; i++) {
        vec2 pos = vec2(
            0.5 + 0.3 * cos(u_time * 0.2 + i * 2.0),
            0.5 + 0.3 * sin(u_time * 0.3 + i * 1.5)
        );
        float spot = 0.15 * exp(-distance(uv, pos) * 8.0);
        color += vec3(0.0, 0.4, 0.8) * spot;
    }
    
    // Subtle noise for texture
    float noise = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
    color += noise * 0.015;
    
    gl_FragColor = vec4(color, 1.0);
}`;

    function cs(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas.width;
        mouse.y = ny * canvas.height;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId;
    function render(t) {
      if (typeof ResizeObserver === 'undefined') syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    }
    render(0);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.reveal-card');
    elements.forEach(el => observer.observe(el));

    return () => {
      elements.forEach(el => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="landing-page-container">
      {/* WebGL Canvas Background */}
      <canvas ref={canvasRef} className="landing-shader-canvas" />

      {/* Top Navbar */}
      <nav className="landing-nav glass-panel">
        <div className="landing-nav-container">
          <div className="navbar-brand">
            <FiCheckSquare className="brand-icon" />
            <span className="brand-text">TaskSphere</span>
          </div>
          
          <div className="landing-nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#workflow" className="nav-link">Workflow</a>
          </div>

          <div className="landing-nav-actions">
            {user ? (
              <Link to="/dashboard" className="btn-primary flex-btn">
                Dashboard <FiArrowRight className="btn-icon" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">Sign In</Link>
                <Link to="/register" className="btn-primary">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Sections */}
      <main className="landing-main">
        {/* Hero Section */}
        <section className="landing-hero">
          <div className="hero-badge-container">
            <div className="glass-panel hero-badge">
              <span className="badge-dot"></span>
              <span className="badge-text">v2.0 Luminous Focus Live</span>
            </div>
          </div>

          <h1 className="hero-title">
            Master Your Tasks with <span className="highlight-text">Precision</span>
          </h1>
          <p className="hero-desc">
            The high-performance digital cockpit designed for elite productivity. Experience a refined workspace where every micro-interaction is tuned for peak velocity and absolute focus.
          </p>

          <div className="hero-ctas">
            {user ? (
              <Link to="/dashboard" className="btn-primary btn-large flex-btn">
                Go to Dashboard <FiArrowRight className="btn-icon" />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary btn-large">Get Started Free</Link>
                <Link to="/login" className="btn-secondary btn-large">Sign In</Link>
              </>
            )}
          </div>

          {/* Dashboard Preview Mockup */}
          <div className="hero-preview reveal-card">
            <div className="glass-panel preview-card mockup-dashboard">
              <div className="mockup-sidebar">
                <div className="mockup-sidebar-logo">
                  <FiCheckSquare className="mockup-logo-icon" />
                  <span>TaskSphere</span>
                </div>
                <div className="mockup-sidebar-links">
                  <div className="mockup-sidebar-link active"><FiList /> Dashboard</div>
                  <div className="mockup-sidebar-link"><FiActivity /> Analytics</div>
                  <div className="mockup-sidebar-link"><FiSliders /> Settings</div>
                </div>
                <div className="mockup-sidebar-user">
                  <div className="mockup-user-avatar">JD</div>
                  <div className="mockup-user-info">
                    <span className="mockup-user-name">John Doe</span>
                    <span className="mockup-user-role">Product Lead</span>
                  </div>
                </div>
              </div>
              <div className="mockup-main">
                <header className="mockup-header">
                  <div className="mockup-search">
                    <FiSearch className="mockup-search-icon" /> <span>Search tasks...</span>
                  </div>
                  <div className="mockup-header-actions">
                    <div className="mockup-badge-glowing">12 Tasks</div>
                  </div>
                </header>
                <div className="mockup-content">
                  <div className="mockup-stats-row">
                    <div className="mockup-stat-item">
                      <span className="stat-label">Total Tasks</span>
                      <span className="stat-num">12</span>
                    </div>
                    <div className="mockup-stat-item">
                      <span className="stat-label">Velocity</span>
                      <span className="stat-num text-highlight">88%</span>
                    </div>
                    <div className="mockup-stat-item">
                      <span className="stat-label">Completed</span>
                      <span className="stat-num text-success">7/12</span>
                    </div>
                  </div>
                  <div className="mockup-board">
                    <div className="mockup-column">
                      <div className="mockup-column-header">
                        <span className="dot dot-pending"></span> Pending (3)
                      </div>
                      <div className="mockup-task-list">
                        <div className="mockup-task-card">
                          <div className="mockup-task-header">
                            <span className="mockup-priority-high">High</span>
                          </div>
                          <h4>Revamp Landing Page UI</h4>
                          <p>Apply Stitch Luminous Focus to all components.</p>
                          <div className="mockup-task-footer">
                            <span className="mockup-date">Due Today</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mockup-column">
                      <div className="mockup-column-header">
                        <span className="dot dot-inprogress"></span> In Progress (2)
                      </div>
                      <div className="mockup-task-list">
                        <div className="mockup-task-card glow-blue">
                          <div className="mockup-task-header">
                            <span className="mockup-priority-medium">Medium</span>
                          </div>
                          <h4>WebGL Ambient Shader</h4>
                          <p>Tweak fragment shader colors for interactive flows.</p>
                          <div className="mockup-task-footer">
                            <span className="mockup-date">Due in 2d</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mockup-column">
                      <div className="mockup-column-header">
                        <span className="dot dot-completed"></span> Completed (7)
                      </div>
                      <div className="mockup-task-list">
                        <div className="mockup-task-card completed">
                          <div className="mockup-task-header">
                            <span className="mockup-priority-low">Low</span>
                          </div>
                          <h4>Setup JWT Middleware</h4>
                          <p>Implement cookie validation with refresh loops.</p>
                          <div className="mockup-task-footer">
                            <span className="mockup-date">Completed</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="landing-features">
          <div className="section-header">
            <div>
              <h2>Engineered for Focus</h2>
              <p>Every feature optimized for zero-friction workflows.</p>
            </div>
          </div>

          <div className="features-grid">
            {/* Feature 1: Task Statistics */}
            <div className="feature-card large-feature glass-panel reveal-card">
              <div className="feature-info">
                <FiActivity className="feature-icon" />
                <h3>Real-time Statistics</h3>
                <p>Visual insights into your productivity patterns. Track velocity, completion rates, and focus blocks with high-precision dashboard telemetry.</p>
              </div>
              <div className="feature-preview-widget">
                <div className="widget-row">
                  <div className="widget-labels">
                    <span>Task Velocity</span>
                    <span className="text-highlight">88%</span>
                  </div>
                  <div className="widget-progress-track">
                    <div className="widget-progress-fill" style={{ width: '88%' }}></div>
                  </div>
                </div>
                <div className="widget-row">
                  <div className="widget-labels">
                    <span>Weekly Target</span>
                    <span className="text-highlight">62%</span>
                  </div>
                  <div className="widget-progress-track">
                    <div className="widget-progress-fill opacity-60" style={{ width: '62%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: Status Toggling */}
            <div className="feature-card glass-panel reveal-card interactive-feature-card">
              <div className="feature-info-block">
                <FiSliders className="feature-icon" />
                <h3>Status Toggling</h3>
                <p>Instant management of task states. Click below to cycle statuses dynamically.</p>
              </div>
              <div className="demo-widget-wrapper">
                <div className="demo-task-item glass-panel" onClick={cycleDemoStatus}>
                  <div className="demo-task-name">Deploy API to Production</div>
                  <span className={`status-selector status-${demoStatus}`}>
                    {demoStatus === 'pending' && 'Pending'}
                    {demoStatus === 'in-progress' && 'In Progress'}
                    {demoStatus === 'completed' && 'Completed'}
                  </span>
                </div>
                <div className="click-hint">← Click tag to toggle →</div>
              </div>
            </div>

            {/* Feature 3: Priorities */}
            <div className="feature-card glass-panel reveal-card interactive-feature-card">
              <div className="feature-info-block">
                <FiInbox className="feature-icon" />
                <h3>Priority Hierarchy</h3>
                <p>Focus on what matters most. Toggle priority chips below to view glows.</p>
              </div>
              <div className="demo-widget-wrapper">
                <div className="demo-priorities-row">
                  <span className={`priority-badge priority-high ${demoPriority === 'high' ? 'active-glow' : 'opacity-40'}`} onClick={() => setDemoPriority('high')}>High</span>
                  <span className={`priority-badge priority-medium ${demoPriority === 'medium' ? 'active-glow' : 'opacity-40'}`} onClick={() => setDemoPriority('medium')}>Medium</span>
                  <span className={`priority-badge priority-low ${demoPriority === 'low' ? 'active-glow' : 'opacity-40'}`} onClick={() => setDemoPriority('low')}>Low</span>
                </div>
                <div className="click-hint">Select a priority level</div>
              </div>
            </div>

            {/* Feature 4: Filter & Search */}
            <div className="feature-card glass-panel reveal-card interactive-feature-card">
              <div className="feature-info-block">
                <FiSearch className="feature-icon" />
                <h3>Filter &amp; Search</h3>
                <p>Find tasks instantly. Try searching "auth" or "glass" in the live demo.</p>
              </div>
              <div className="demo-search-widget">
                <div className="demo-search-input-wrapper">
                  <FiSearch className="demo-search-icon" />
                  <input
                    type="text"
                    placeholder="Type to filter..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="demo-search-input"
                  />
                </div>
                <div className="demo-search-results">
                  {filteredDemoTasks.length > 0 ? (
                    filteredDemoTasks.map(t => (
                      <div key={t.id} className="demo-search-item">
                        <span>{t.title}</span>
                        <span className="demo-cat-badge">{t.cat}</span>
                      </div>
                    ))
                  ) : (
                    <div className="demo-search-empty">No matching tasks</div>
                  )}
                </div>
              </div>
            </div>

            {/* Feature 5: Session Persistence */}
            <div className="feature-card glass-panel reveal-card interactive-feature-card">
              <div className="feature-info-block">
                <FiClock className="feature-icon" />
                <h3>Session Persistence</h3>
                <p>Secure JWT cookie sessions. Click below to simulate state expiry.</p>
              </div>
              <div className="demo-widget-wrapper" onClick={() => setSessionActive(!sessionActive)}>
                <div className={`demo-session-badge ${sessionActive ? 'active' : 'inactive'}`}>
                  <FiClock className="session-icon" />
                  <span>{sessionActive ? 'Session Active (JWT)' : 'Session Expired'}</span>
                  <span className="pulse-dot"></span>
                </div>
                <div className="click-hint">Click badge to toggle active state</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section id="workflow" className="landing-cta-banner">
          <div className="cta-banner-content glass-panel reveal-card">
            <div className="cta-bg-glow shadow-left"></div>
            <div className="cta-bg-glow shadow-right"></div>
            <h2>Ready to reach peak performance?</h2>
            <p>Join elite professionals who have optimized their workflows with TaskSphere.</p>
            <div className="cta-buttons">
              {user ? (
                <Link to="/dashboard" className="btn-primary btn-large">Launch App</Link>
              ) : (
                <>
                  <Link to="/register" className="btn-primary btn-large">Get TaskSphere Free</Link>
                  <Link to="/login" className="btn-secondary btn-large">Sign In</Link>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <span className="footer-logo">TaskSphere</span>
          </div>
          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
          </div>
          <div className="footer-copy">
            © 2026 TaskSphere. All rights reserved. Built for Virtual Internship Showcase.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
