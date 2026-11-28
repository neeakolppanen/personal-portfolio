import "./Hero.css";

function Hero() {
    return (
        <section className="hero" id="top" aria-labelledby="hero-title">
            <div className="hero-content">
                <p className="hero-eyebrow">NEEA CAMILLA · PORTFOLIO</p>

                <h1 id="hero-title" className="hero-title">
                    Tietotekniikan opiskelija ja yrittäjä.
                </h1>

                <p className="hero-description">
                    Rakennan selkeitä ja tunnelmallisia nettisivuja sekä verkkosovelluksia.
                </p>

                <div className="hero-actions">
                    <a href="#portfolio" className="btn-primary">
                        Katso portfolio
                    </a>
                    <a href="#yhteystiedot" className="btn-secondary">
                        Ota yhteyttä
                    </a>
                </div>
            </div>
        </section>
    );
}

export default Hero;
