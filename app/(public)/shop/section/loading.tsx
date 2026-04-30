import styles from "./section-loading.module.css";

const BB8_SVG = `
<svg viewBox="0 0 250 250" width="320" height="320" aria-hidden="true">
  <defs>
    <clipPath id="body"><circle cx="0" cy="0" r="33.75"></circle></clipPath>
    <clipPath id="len"><circle cx="0" cy="16.5" r="6.75"></circle></clipPath>
    <linearGradient id="lens" x1="0" x2="0.25" y1="0" y2="0.25" spreadMethod="repeat">
      <stop offset="0" stop-color="transparent"></stop>
      <stop offset="0.5" stop-color="transparent"></stop>
      <stop offset="0" stop-color="#fff"></stop>
      <stop offset="1" stop-color="#fff"></stop>
    </linearGradient>
    <path id="dash" stroke-dasharray="20 4 2" d="M 0 0 h 26"></path>
    <path id="dash--small" d="M 0 0 h 8"></path>
    <path id="particle" d="M 0 -2 a 5 5 0 0 0 0 4 a 5 5 0 0 0 0 -4 m -2 2 a 5 5 0 0 0 4 0 a 5 5 0 0 0 -4 0"></path>
  </defs>
  <g fill="none" stroke="#254256" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 152.5)">
    <g id="ground" class="ground">
      <path stroke-dasharray="40 6 6 6 120 6 40 6 6" d="M 1.25 0 h 20 a 3 3 0 0 1 6 0 h 160 a 3 3 0 0 1 6 0 h 55.5"></path>
      <g transform="translate(0 20)">
        <path stroke-dasharray="30 15 50" d="M 60 0 h 8 a 3 3 0 0 1 6 0 h 50 a 3 3 0 0 1 6 0 h 10"></path>
        <g transform="translate(0 20)">
          <path d="M 85 0 h 15 a 3 3 0 0 1 6 0 h 7"></path>
        </g>
      </g>
    </g>
    <use href="#ground" transform="translate(-250 0)"></use>
  </g>
  <g fill="none" stroke="#254256" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" transform="translate(86 56)">
    <g>
      <use href="#dash" class="dash" style="animation-delay: -0.75s"></use>
      <g transform="translate(10 15)">
        <use href="#dash" class="dash" style="animation-delay: -0.6s"></use>
      </g>
      <g fill="#FF7761" stroke="#FF7761">
        <g transform="translate(10 7.5)"><use style="animation-delay: -0.8s;" href="#particle" class="particle" transform="scale(0.9)"></use></g>
        <g transform="translate(80 50)"><use style="animation-delay: -0.5s;" href="#particle" class="particle" transform="scale(1.2)"></use></g>
        <g transform="translate(95 40)"><use style="animation-delay: -0.4s;" href="#particle" class="particle" transform="scale(0.6)"></use></g>
        <g transform="translate(115 58)"><use style="animation-delay: -0.25s;" href="#particle" class="particle" transform="scale(0.6)"></use></g>
        <g transform="translate(100 65)"><use style="animation-delay: -0.37s;" href="#particle" class="particle" transform="scale(0.5)"></use></g>
        <g transform="translate(65 78)"><use style="animation-delay: -0.55s;" href="#particle" class="particle" transform="scale(0.7)"></use></g>
        <g transform="translate(30 90)"><use style="animation-delay: -0.7s;" href="#particle" class="particle" transform="scale(0.7)"></use></g>
      </g>
      <g fill="#FDC33E" stroke="#FDC33E">
        <g transform="translate(60 18)"><use style="animation-delay: -0.62s;" href="#particle" class="particle" transform="scale(1.1)"></use></g>
        <g transform="translate(40 40)"><use style="animation-delay: -0.75s;" href="#particle" class="particle" transform="scale(1)"></use></g>
        <g transform="translate(100 40)"><use style="animation-delay: -0.25s;" href="#particle" class="particle" transform="scale(0.5)"></use></g>
        <g transform="translate(90 52)"><use style="animation-delay: -0.34s;" href="#particle" class="particle" transform="scale(0.85)"></use></g>
        <g transform="translate(65 68)"><use style="animation-delay: -0.55s;" href="#particle" class="particle" transform="scale(0.6)"></use></g>
      </g>
      <g fill="#449AAB" stroke="#449AAB">
        <g transform="translate(20 25)"><use style="animation-delay: -0.8s;" href="#particle" class="particle" transform="scale(1.3)"></use></g>
      </g>
      <g fill="#39B4C1" stroke="#39B4C1">
        <g transform="translate(28 12)"><use style="animation-delay: -0.88s;" href="#particle" class="particle" transform="scale(0.8)"></use></g>
        <g transform="translate(46 58)"><use style="animation-delay: -0.66s;" href="#particle" class="particle" transform="scale(0.75)"></use></g>
        <g transform="translate(30 80)"><use style="animation-delay: -0.74s;" href="#particle" class="particle" transform="scale(0.75)"></use></g>
      </g>
    </g>
  </g>
  <g fill="#EBF2FB" stroke="#254256" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" transform="translate(1.25 1.25)">
    <g transform="translate(100 50)">
      <g transform="translate(0 65)">
        <g class="bb8-base" transform="translate(0 0) rotate(-40)">
          <g transform="translate(0 -65)">
            <g transform="translate(0 65)">
              <g class="bb8-center">
                <circle cx="0" cy="0" r="35"></circle>
                <g clip-path="url(#body)">
                  <path fill="none" d="M -15 -25 L 35 0 L -5 28 z"></path>
                  <circle fill="#FEC140" cx="-15" cy="-25" r="22"></circle>
                  <circle cx="-15" cy="-25" r="9"></circle>
                  <ellipse fill="#FEC140" cx="35" cy="0" ry="30" rx="10"></ellipse>
                  <ellipse fill="#FEC140" cx="-5" cy="28" rx="20" ry="18"></ellipse>
                  <ellipse cx="-5" cy="28" rx="8" ry="7.2"></ellipse>
                  <circle fill="#254256" stroke="none" cx="7" cy="1" r="2"></circle>
                  <circle fill="#254256" stroke="none" cx="-22" cy="4.5" r="2"></circle>
                  <g stroke="none" fill="#254256" opacity="0.2">
                    <path d="M -45 0 a 45 45 0 0 1 90 0 a 55 55 0 0 0 -90 0"></path>
                    <path transform="rotate(-15)" d="M -35 0 a 35 35 0 0 0 70 0 a 37 37 0 0 1 -70 0"></path>
                  </g>
                </g>
              </g>
            </g>
            <g>
              <path d="M -29 29 l 6 8 h 46 l 6 -8 a 29 29 0 0 0 -58 0"></path>
              <g stroke="none">
                <path opacity="0.85" fill="#fff" d="M 0 1.25 a 27.75 27.75 0 0 0 -27.75 27.25 h 5 a 27.5 27.5 0 0 1 22.75 -27.25"></path>
                <path opacity="0.15" fill="#254256" d="M 0 1.25 a 27.75 27.75 0 0 1 27.75 27.25 h -5 a 27.5 27.5 0 0 0 -22.75 -27.25"></path>
                <path opacity="0.25" fill="#254256" d="M -27.75 28.5 l 6 8 h 43.5 l 6 -8 h -15.25 q -5 0 -5 -10 h -15 q 0 10 -5 10"></path>
              </g>
              <circle cx="0" cy="16.5" r="8" fill="#295A6E"></circle>
              <g clip-path="url(#len)">
                <g class="reflection">
                  <circle cx="0" cy="16.5" r="8" fill="url(#lens)" opacity="0.1"></circle>
                </g>
              </g>
              <circle cx="17" cy="24" r="3" stroke="none" fill="#254256"></circle>
            </g>
          </g>
        </g>
      </g>
    </g>
  </g>
  <g fill="none" stroke="#254256" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" transform="translate(102 77)">
    <g>
      <use class="dash" href="#dash--small" style="animation-delay: -0.56s"></use>
      <g transform="translate(28 47)">
        <use class="dash" href="#dash--small" style="animation-delay: -0.4s"></use>
        <g transform="translate(5 5)">
          <use class="dash" href="#dash--small" style="animation-delay: -0.34s"></use>
          <g transform="translate(13 0)">
            <use class="dash" stroke-dasharray="3 5" href="#dash--small" style="animation-delay: -0.3s"></use>
          </g>
        </g>
      </g>
    </g>
  </g>
</svg>
`;

export default function Loading() {
  return (
    <div className={styles.wrap} role="status" aria-live="polite" aria-label="جاري تحميل القسم">
      <div className={styles.loader} dangerouslySetInnerHTML={{ __html: BB8_SVG }} />
      <p className={styles.text}>جاري تحميل القسم...</p>
    </div>
  );
}
