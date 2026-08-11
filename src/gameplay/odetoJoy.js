// Ode to Joy(歡樂頌)— Beethoven 第九交響曲 — G 大調 / 第一把位
//
// 主題 8 小節 4/4 拍,A + A' 結構:
//   A:  B B C D | D C B A | G G A B | B  A  A—   (Mi Mi Fa Sol Sol Fa Mi Re Do Do Re Mi Mi Re Re)
//   A': B B C D | D C B A | G G A B | A  G  G—   (結尾下行到主音 G)
//
// 第一把位指法:
//   G3  → G 弦空弦
//   A3  → G 弦 1 指
//   B3  → G 弦 2 指
//   C4  → G 弦 3 指
//   D4  → D 弦空弦(比 G 弦 4 指更乾淨)

const QUARTER = 600;
const HALF    = 1200;
// 註:原本樂句末尾用 BREATH=200ms,但為了讓 metronome 跟譜面同步已移除。

function n(string, pitch, durationMs = QUARTER, gapAfterMs = 0) {
  return { string, pitch, durationMs, gapAfterMs };
}

export const ODE_TO_JOY_G_MAJOR = [
  // ─── A 主題 ───
  // m1: B B C D
  n('G', 'B3'),
  n('G', 'B3'),
  n('G', 'C4'),
  n('D', 'D4'),
  // m2: D C B A
  n('D', 'D4'),
  n('G', 'C4'),
  n('G', 'B3'),
  n('G', 'A3'),
  // m3: G G A B
  n('G', 'G3'),
  n('G', 'G3'),
  n('G', 'A3'),
  n('G', 'B3'),
  // m4: B A A—  (樂句結尾,A 為二分音符 + 樂句呼吸)
  n('G', 'B3'),
  n('G', 'A3'),
  n('G', 'A3', HALF),

  // ─── A' 主題 ───
  // m5: B B C D
  n('G', 'B3'),
  n('G', 'B3'),
  n('G', 'C4'),
  n('D', 'D4'),
  // m6: D C B A
  n('D', 'D4'),
  n('G', 'C4'),
  n('G', 'B3'),
  n('G', 'A3'),
  // m7: G G A B
  n('G', 'G3'),
  n('G', 'G3'),
  n('G', 'A3'),
  n('G', 'B3'),
  // m8: A G G——  (收尾於主音 G,二分音符)
  n('G', 'A3'),
  n('G', 'G3'),
  n('G', 'G3', HALF),
];