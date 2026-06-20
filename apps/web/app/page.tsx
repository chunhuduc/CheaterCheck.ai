import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">Dating risk intelligence</p>
          <h1>Know the signals before you invest your time.</h1>
          <p className="lede">
            CheaterCheck.ai cross-references face signals, profile names, and
            locations to highlight potential risk. Private search, instant
            results, no login required.
          </p>
          <div className="hero-actions">
            <Link href="/search" className="btn-primary">
              Run a check
            </Link>
            <a href="#how" className="btn-secondary">
              See how it works
            </a>
          </div>
          <div className="hero-meta">
            <div>
              <strong>90 sec</strong>
              <span>Average lookup</span>
            </div>
            <div>
              <strong>Live</strong>
              <span>Realtime crawl</span>
            </div>
            <div>
              <strong>Private</strong>
              <span>No alerts sent</span>
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-top">
            <span>Risk Summary</span>
            <span>Low Confidence</span>
          </div>
          <div className="risk-score">
            <strong>38</strong>
            <span>Signal score</span>
          </div>
          <ul className="panel-list">
            <li>
              <span>Dating app overlap</span>
              <strong>2 sources</strong>
            </li>
            <li>
              <span>Recent activity</span>
              <strong>Active 7 days</strong>
            </li>
            <li>
              <span>Alias matches</span>
              <strong>1 potential</strong>
            </li>
          </ul>
        </div>
      </section>

      <section id="how" className="block">
        <h2>How CheaterCheck works</h2>
        <p className="lede">
          We combine face signals, public data, and fast queries to surface risk
          indicators. You stay in control.
        </p>
        <div className="step-grid">
          <div className="card">
            <h3>1. Upload a photo</h3>
            <p>Use a clear face photo from the dating profile.</p>
          </div>
          <div className="card">
            <h3>2. Add name + location</h3>
            <p>We normalize the text signals and prep the lookup.</p>
          </div>
          <div className="card">
            <h3>3. Review insights</h3>
            <p>Unlock the report to see confidence and matched signals.</p>
          </div>
        </div>
      </section>

      <section id="pricing" className="block">
        <h2>Simple pricing</h2>
        <p className="lede">No subscriptions. Buy checks as you need them.</p>
        <div className="price-grid">
          <article className="card">
            <h3>Single Check</h3>
            <p className="price">$18</p>
            <ul>
              <li>1 profile lookup</li>
              <li>Basic risk score</li>
              <li>Instant report</li>
            </ul>
            <Link href="/search" className="btn-primary">
              Start now
            </Link>
          </article>
          <article className="card featured">
            <h3>3 Checks</h3>
            <p className="price">$39</p>
            <ul>
              <li>3 profile lookups</li>
              <li>Deep signal match</li>
              <li>Priority support</li>
            </ul>
            <Link href="/search" className="btn-primary">
              Buy bundle
            </Link>
          </article>
          <article className="card">
            <h3>Team Pack</h3>
            <p className="price">$99</p>
            <ul>
              <li>10 profile lookups</li>
              <li>Shared results</li>
              <li>Safety resources</li>
            </ul>
            <Link href="/search" className="btn-primary">
              Get pack
            </Link>
          </article>
        </div>
      </section>

      <section id="faq" className="block">
        <h2>Questions</h2>
        <div className="faq-grid">
          <div className="card">
            <h4>Is this legal?</h4>
            <p>We only use public data and hashed signals you provide.</p>
          </div>
          <div className="card">
            <h4>Will the person be notified?</h4>
            <p>No. Searches are private and never alert the subject.</p>
          </div>
          <div className="card">
            <h4>How accurate is it?</h4>
            <p>We show confidence levels and recommend next steps.</p>
          </div>
          <div className="card">
            <h4>Can I delete my data?</h4>
            <p>Yes. Use the delete request link in the report email.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
