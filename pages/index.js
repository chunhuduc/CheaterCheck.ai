import Link from "next/link";
import Layout from "../components/Layout";
import styles from "../styles/Home.module.css";

export default function Home() {
  return (
    <Layout>
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Dating risk intelligence</p>
            <h1>
              Know the signals before you invest your time.
            </h1>
            <p className={styles.lede}>
              CheaterCheck.ai cross-references face signals, profile names, and
              locations to highlight potential risk. Private search, instant
              results, no login required.
            </p>
            <div className={styles.heroActions}>
              <Link href="/search" className={styles.ctaPrimary}>
                Run a check
              </Link>
              <a href="#how" className={styles.ctaGhost}>
                See how it works
              </a>
            </div>
            <div className={styles.heroMeta}>
              <div>
                <strong>90 sec</strong>
                <span>Average lookup</span>
              </div>
              <div>
                <strong>10k+</strong>
                <span>Signals indexed</span>
              </div>
              <div>
                <strong>Private</strong>
                <span>No alerts sent</span>
              </div>
            </div>
          </div>
          <div className={styles.heroPanel}>
            <div className={styles.panelTop}>
              <p>Risk Summary</p>
              <span>Low Confidence</span>
            </div>
            <div className={styles.riskScore}>
              <strong>38</strong>
              <span>Signal score</span>
            </div>
            <ul className={styles.panelList}>
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
            <Link href="/search" className={styles.panelCta}>
              Analyze a profile
            </Link>
          </div>
        </section>

        <section id="how" className={styles.steps}>
          <div>
            <h2>How CheaterCheck works</h2>
            <p>
              We combine face signals, public data, and HarperDB fast queries to
              surface risk indicators. You stay in control.
            </p>
          </div>
          <div className={styles.stepGrid}>
            <div className={styles.stepCard}>
              <h3>1. Upload a photo</h3>
              <p>Use a clear face photo from the dating profile.</p>
            </div>
            <div className={styles.stepCard}>
              <h3>2. Add name + location</h3>
              <p>We normalize text signals and prep HarperDB lookups.</p>
            </div>
            <div className={styles.stepCard}>
              <h3>3. Review insights</h3>
              <p>Unlock the report to see confidence and matched signals.</p>
            </div>
          </div>
        </section>

        <section className={styles.signalBand}>
          <div>
            <h2>Signal layers</h2>
            <p>Built for speed and discretion, every query stays anonymous.</p>
          </div>
          <div className={styles.signalGrid}>
            <div>
              <strong>Discovery</strong>
              <p>Profiles, aliases, and open web indicators.</p>
            </div>
            <div>
              <strong>Reputation</strong>
              <p>Risk markers scored with confidence and recency.</p>
            </div>
            <div>
              <strong>Resolution</strong>
              <p>Clear, actionable steps and safe conversation prompts.</p>
            </div>
          </div>
        </section>

        <section id="pricing" className={styles.pricing}>
          <div>
            <h2>Simple pricing</h2>
            <p>No subscriptions. Buy checks as you need them.</p>
          </div>
          <div className={styles.priceGrid}>
            <article>
              <h3>Single Check</h3>
              <p className={styles.price}>$18</p>
              <ul>
                <li>1 profile lookup</li>
                <li>Basic risk score</li>
                <li>Instant report</li>
              </ul>
              <Link href="/search" className={styles.ctaPrimary}>
                Start now
              </Link>
            </article>
            <article className={styles.featuredPrice}>
              <div className={styles.tag}>Most popular</div>
              <h3>3 Checks</h3>
              <p className={styles.price}>$39</p>
              <ul>
                <li>3 profile lookups</li>
                <li>Deep signal match</li>
                <li>Priority support</li>
              </ul>
              <Link href="/search" className={styles.ctaPrimary}>
                Buy bundle
              </Link>
            </article>
            <article>
              <h3>Team Pack</h3>
              <p className={styles.price}>$99</p>
              <ul>
                <li>10 profile lookups</li>
                <li>Shared results</li>
                <li>Safety resources</li>
              </ul>
              <Link href="/search" className={styles.ctaPrimary}>
                Get pack
              </Link>
            </article>
          </div>
        </section>

        <section id="faq" className={styles.faq}>
          <h2>Questions</h2>
          <div className={styles.faqGrid}>
            <div>
              <h4>Is this legal?</h4>
              <p>We only use public data and hashed signals you provide.</p>
            </div>
            <div>
              <h4>Will the person be notified?</h4>
              <p>No. Searches are private and never alert the subject.</p>
            </div>
            <div>
              <h4>How accurate is it?</h4>
              <p>We show confidence levels and recommend next steps.</p>
            </div>
            <div>
              <h4>Can I delete my data?</h4>
              <p>Yes. Use the delete request form in the report email.</p>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
