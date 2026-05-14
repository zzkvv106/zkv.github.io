/* --- Games Logic Hub --- */

// --- Global Game States ---
let bjDeck = [], bjPlayer = [], bjDealer = [], bjActive = false;
let typerWords = [], typerIndex = 0, typerTime = 30, typerTimer = null, typerActive = false, typerCorrect = 0;
let mGrid = [], mGameOver = false, mTime = 0, mTimer = null;
let reactState = 'idle', reactTimer = null, reactStart = 0;
let seqPattern = [], seqInput = [], seqLevel = 1, seqPlaying = false;
let aimCount = 0, aimStartTime = 0, aimActive = false;
let verbalScore = 0, verbalLives = 3, verbalSeenWords = new Set(), verbalCurrentWord = "";
let visualLevel = 1, visualPattern = [], visualUserPattern = [], visualCanClick = false;
let numberLevelCount = 1, currentNumberVal = "";
let chimpLevelCount = 4, chimpNextNum = 1;
let mathScoreCount = 0, mathTimeLeft = 60, mathGlobalTimer = null, mathCurrentAns = 0;
let stroopScoreCount = 0, stroopTimeLeft = 30, stroopGlobalTimer = null;
let gridNextVal = 1, gridStartTimestamp = 0, gridGameActive = false;
let colorScoreTotal = 0, colorSecondsLeft = 15, colorMainTimer = null;
let flipPairsNeeded = 8, flipCurrentActive = [], flipMovesTotal = 0;

// --- Shared Utilities ---
function closeAllOverlays() {
    document.querySelectorAll('.game-overlay').forEach(el => el.style.display = 'none');
    
    // Stop and Reset all game states/timers
    aimActive = false;
    typerActive = false;
    mGameOver = true;
    gridGameActive = false;
    visualCanClick = false;
    
    if (mathGlobalTimer) clearInterval(mathGlobalTimer);
    if (stroopGlobalTimer) clearInterval(stroopGlobalTimer);
    if (colorMainTimer) clearInterval(colorMainTimer);
    if (typerTimer) clearInterval(typerTimer);
    if (mTimer) clearInterval(mTimer);
    if (reactTimer) clearTimeout(reactTimer);
    
    document.querySelectorAll('.game-btn').forEach(btn => btn.disabled = false);
}

function openOverlay(id) {
    console.log("Opening overlay:", id);
    closeAllOverlays();
    const el = document.getElementById(id);
    if (el) {
        el.style.display = 'flex';
    } else {
        console.error("Overlay not found:", id);
    }
}

// Global Initialization
function initAllGames() {
    console.log("Initializing all games...");
    closeAllOverlays();

    // Standard Exit buttons
    document.querySelectorAll('.close-game-btn').forEach(btn => {
        btn.onclick = closeAllOverlays;
    });

    // Launcher Logic (Generic)
    const launchers = {
        'launch-blackjack': 'blackjack-overlay',
        'launch-typer': 'typer-overlay',
        'launch-mines': 'mines-overlay',
        'launch-reaction': 'reaction-overlay',
        'launch-sequence': 'sequence-overlay',
        'launch-aim': 'aim-overlay',
        'launch-verbal': 'verbal-overlay',
        'launch-visual': 'visual-overlay',
        'launch-number': 'number-overlay',
        'launch-chimp': 'chimp-overlay',
        'launch-math': 'math-overlay',
        'launch-stroop': 'stroop-overlay',
        'launch-grid': 'grid-overlay',
        'launch-color': 'color-overlay',
        'launch-flip': 'flip-overlay'
    };

    for (const [btnId, overlayId] of Object.entries(launchers)) {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.onclick = () => {
                openOverlay(overlayId);
                // Trigger specific init if needed
                if (btnId === 'launch-mines') startMines();
            };
        }
    }

    // Individual Game-specific event listeners (non-launcher)
    initBlackjack();
    initTyper();
    initReaction();
    initSequence();
    initAim();
    initVerbal();
    initVisual();
    initNumber();
    initChimp();
    initMath();
    initStroop();
    initGrid();
    initColor();
    initFlip();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllGames);
} else {
    initAllGames();
}


// --- BLACKJACK ---
const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function initBlackjack() {
    const launchBtn = document.getElementById('launch-blackjack');
    if (launchBtn) launchBtn.addEventListener('click', () => openOverlay('blackjack-overlay'));

    document.getElementById('bj-deal')?.addEventListener('click', bjStart);
    document.getElementById('bj-hit')?.addEventListener('click', bjHit);
    document.getElementById('bj-stand')?.addEventListener('click', bjStand);
}

function bjCreateDeck() {
    bjDeck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            let weight = parseInt(rank);
            if (rank === 'J' || rank === 'Q' || rank === 'K') weight = 10;
            if (rank === 'A') weight = 11;
            bjDeck.push({ suit, rank, weight });
        }
    }
}

function bjShuffle() {
    for (let i = 0; i < 1000; i++) {
        let l1 = Math.floor(Math.random() * bjDeck.length);
        let l2 = Math.floor(Math.random() * bjDeck.length);
        [bjDeck[l1], bjDeck[l2]] = [bjDeck[l2], bjDeck[l1]];
    }
}

function bjScore(hand) {
    let score = 0, aces = 0;
    for (let c of hand) { score += c.weight; if (c.rank === 'A') aces++; }
    while (score > 21 && aces > 0) { score -= 10; aces--; }
    return score;
}

function bjRender(card, container) {
    const el = document.createElement('div');
    el.className = `card ${['♥', '♦'].includes(card.suit) ? 'red' : 'black'}`;
    el.innerHTML = `<div class="card-rank-top">${card.rank}</div><div class="card-suit-center">${card.suit}</div><div class="card-rank-bot">${card.rank}</div>`;
    container.appendChild(el);
}

function bjStart() {
    bjActive = true;
    bjCreateDeck();
    bjShuffle();
    bjPlayer = [bjDeck.pop(), bjDeck.pop()];
    bjDealer = [bjDeck.pop(), bjDeck.pop()];

    document.getElementById('bj-deal').disabled = true;
    document.getElementById('bj-hit').disabled = false;
    document.getElementById('bj-stand').disabled = false;
    document.getElementById('bj-msg').innerText = "HIT OR STAND?";

    bjUpdateUI(false);
    if (bjScore(bjPlayer) === 21) bjOver("BLACKJACK! YOU WIN!");
}

function bjUpdateUI(showDealer) {
    const dCards = document.getElementById('bj-dealer-cards');
    const pCards = document.getElementById('bj-player-cards');
    const dScore = document.getElementById('bj-dealer-score');
    const pScore = document.getElementById('bj-player-score');

    dCards.innerHTML = ''; pCards.innerHTML = '';

    if (bjDealer.length > 0) {
        if (showDealer) {
            bjDealer.forEach(c => bjRender(c, dCards));
            dScore.innerText = bjScore(bjDealer);
        } else {
            bjRender(bjDealer[0], dCards);
            const back = document.createElement('div'); back.className = 'card back'; dCards.appendChild(back);
            dScore.innerText = "?";
        }
    }

    bjPlayer.forEach(c => bjRender(c, pCards));
    pScore.innerText = bjScore(bjPlayer);
}

function bjHit() {
    if (!bjActive) return;
    bjPlayer.push(bjDeck.pop());
    bjUpdateUI(false);
    if (bjScore(bjPlayer) > 21) bjOver("BUST! YOU LOSE.");
}

function bjStand() {
    if (!bjActive) return;
    bjUpdateUI(true);
    let ds = bjScore(bjDealer);
    while (ds < 17) {
        bjDealer.push(bjDeck.pop());
        ds = bjScore(bjDealer);
    }
    bjUpdateUI(true);
    const ps = bjScore(bjPlayer);
    if (ds > 21) bjOver("DEALER BUST! WIN!");
    else if (ds > ps) bjOver("DEALER WINS.");
    else if (ds < ps) bjOver("YOU WIN!");
    else bjOver("PUSH.");
}

function bjOver(msg) {
    bjActive = false;
    document.getElementById('bj-msg').innerText = msg;
    document.getElementById('bj-deal').disabled = false;
    document.getElementById('bj-hit').disabled = true;
    document.getElementById('bj-stand').disabled = true;
}


// --- SPEED TYPER ---
const words = ["linux", "code", "python", "java", "pixel", "retro", "macintosh", "apple", "system", "kernel", "terminal", "bash", "deploy", "server", "react", "html", "css", "docker", "cloud", "git", "merge", "pull", "push", "commit", "branch", "repo", "clone", "fork", "issue", "bug", "feature", "style", "script", "const", "let", "var", "function", "class", "async", "await", "promise", "api", "json", "data", "fetch", "node", "npm", "yarn", "build", "test"];

function initTyper() {
    document.getElementById('launch-typer')?.addEventListener('click', () => openOverlay('typer-overlay'));
    document.getElementById('typer-start')?.addEventListener('click', startTyper);
    document.getElementById('typer-input')?.addEventListener('input', checkTyperInput);
}

function startTyper() {
    typerActive = true;
    typerTime = 30;
    typerIndex = 0;
    typerCorrect = 0;
    typerWords = [];

    // Generate 50 random words
    for (let i = 0; i < 50; i++) typerWords.push(words[Math.floor(Math.random() * words.length)]);

    renderTyperWords();

    const input = document.getElementById('typer-input');
    input.disabled = false;
    input.value = '';
    input.focus();
    input.classList.remove('error');

    document.getElementById('typer-start').disabled = true;

    clearInterval(typerTimer);
    typerTimer = setInterval(() => {
        typerTime--;
        document.getElementById('typer-time').innerText = typerTime;
        const wpm = Math.floor((typerCorrect / ((30 - typerTime) / 60)) || 0);
        document.getElementById('typer-wpm').innerText = wpm;

        if (typerTime <= 0) endTyper();
    }, 1000);
}

function renderTyperWords() {
    const display = document.getElementById('typer-display');
    display.innerHTML = '';
    for (let i = typerIndex; i < Math.min(typerIndex + 15, typerWords.length); i++) {
        const span = document.createElement('span');
        span.className = `word ${i === typerIndex ? 'current' : ''}`;
        span.innerText = typerWords[i];
        display.appendChild(span);
    }
}

function checkTyperInput(e) {
    if (!typerActive) return;
    const input = e.target;
    const currentWord = typerWords[typerIndex];
    const val = input.value.trim();

    if (input.value.endsWith(' ')) {
        const typed = input.value.trim();
        if (typed === currentWord) {
            typerCorrect++;
            typerIndex++;
            renderTyperWords();
            input.value = '';
            input.classList.remove('error');
        } else {
            input.classList.add('error');
        }
    } else {
        if (currentWord.startsWith(val)) {
            input.classList.remove('error');
        } else {
            input.classList.add('error');
        }
    }
}

function endTyper() {
    typerActive = false;
    clearInterval(typerTimer);
    document.getElementById('typer-input').disabled = true;
    document.getElementById('typer-start').disabled = false;
    document.getElementById('typer-display').innerHTML = `GAME OVER! <br> WPM: ${document.getElementById('typer-wpm').innerText}`;
}

// --- MINESWEEPER ---
const mRows = 10, mCols = 10, mMines = 10;

function initMines() {
    document.getElementById('launch-mines')?.addEventListener('click', () => {
        openOverlay('mines-overlay');
        startMines();
    });
    document.getElementById('mines-reset')?.addEventListener('click', startMines);
}

function startMines() {
    mGameOver = false;
    mGrid = [];
    mTime = 0;
    clearInterval(mTimer);
    document.getElementById('mines-timer').innerText = 0;
    document.getElementById('mines-count').innerText = mMines;

    mTimer = setInterval(() => {
        mTime++;
        document.getElementById('mines-timer').innerText = mTime;
    }, 1000);

    const gridEl = document.getElementById('mines-grid');
    gridEl.innerHTML = '';

    for (let r = 0; r < mRows; r++) {
        const row = [];
        for (let c = 0; c < mCols; c++) {
            row.push({ isMine: false, revealed: false, flagged: false, count: 0 });
            const cell = document.createElement('div');
            cell.className = 'mine-cell';
            cell.dataset.r = r;
            cell.dataset.c = c;
            cell.addEventListener('click', () => clickMine(r, c));
            cell.addEventListener('contextmenu', (e) => { e.preventDefault(); flagMine(r, c); });
            gridEl.appendChild(cell);
        }
        mGrid.push(row);
    }

    let minesPlaced = 0;
    while (minesPlaced < mMines) {
        const r = Math.floor(Math.random() * mRows);
        const c = Math.floor(Math.random() * mCols);
        if (!mGrid[r][c].isMine) {
            mGrid[r][c].isMine = true;
            minesPlaced++;
        }
    }

    for (let r = 0; r < mRows; r++) {
        for (let c = 0; c < mCols; c++) {
            if (!mGrid[r][c].isMine) {
                let count = 0;
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (r + i >= 0 && r + i < mRows && c + j >= 0 && c + j < mCols && mGrid[r + i][c + j].isMine) count++;
                    }
                }
                mGrid[r][c].count = count;
            }
        }
    }
}

function clickMine(r, c) {
    if (mGameOver || mGrid[r][c].flagged || mGrid[r][c].revealed) return;

    if (mGrid[r][c].isMine) {
        revealMines();
        alert('GAME OVER');
        mGameOver = true;
        clearInterval(mTimer);
    } else {
        revealCell(r, c);
        checkWin();
    }
}

function flagMine(r, c) {
    if (mGameOver || mGrid[r][c].revealed) return;
    mGrid[r][c].flagged = !mGrid[r][c].flagged;
    updateMineCell(r, c);
}

function revealCell(r, c) {
    if (r < 0 || r >= mRows || c < 0 || c >= mCols || mGrid[r][c].revealed || mGrid[r][c].flagged) return;

    mGrid[r][c].revealed = true;
    updateMineCell(r, c);

    if (mGrid[r][c].count === 0) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                revealCell(r + i, c + j);
            }
        }
    }
}

function updateMineCell(r, c) {
    const cell = document.querySelector(`.mine-cell[data-r="${r}"][data-c="${c}"]`);
    const data = mGrid[r][c];

    if (data.revealed) {
        cell.classList.add('revealed');
        if (data.isMine) {
            cell.classList.add('mine');
            cell.innerText = '💣';
        } else if (data.count > 0) {
            cell.innerText = data.count;
            const colors = ['blue', 'green', 'red', 'purple', 'maroon', 'turquoise', 'black', 'gray'];
            cell.style.color = colors[data.count - 1];
        }
    } else if (data.flagged) {
        cell.classList.add('flagged');
    } else {
        cell.classList.remove('flagged');
        cell.innerText = '';
    }
}

function revealMines() {
    for (let r = 0; r < mRows; r++) {
        for (let c = 0; c < mCols; c++) {
            if (mGrid[r][c].isMine) {
                mGrid[r][c].revealed = true;
                updateMineCell(r, c);
            }
        }
    }
}

function checkWin() {
    let unrevealedSafe = 0;
    for (let r = 0; r < mRows; r++) {
        for (let c = 0; c < mCols; c++) {
            if (!mGrid[r][c].isMine && !mGrid[r][c].revealed) unrevealedSafe++;
        }
    }
    if (unrevealedSafe === 0) {
        alert('YOU WIN! Time: ' + mTime);
        mGameOver = true;
        clearInterval(mTimer);
    }
}

// --- REACTION ---

function initReaction() {
    document.getElementById('launch-reaction')?.addEventListener('click', () => {
        openOverlay('reaction-overlay');
        resetReaction();
    });
    document.getElementById('reaction-area')?.addEventListener('click', handleReactionClick);
}

function resetReaction() {
    reactState = 'waiting';
    const area = document.getElementById('reaction-area');
    area.className = 'fullscreen-click-area waiting';
    document.querySelector('.reaction-msg').innerText = "WAIT FOR GREEN...";
    document.querySelector('.reaction-score').classList.add('hidden');

    clearTimeout(reactTimer);
    const delay = 2000 + Math.random() * 3000;
    reactTimer = setTimeout(() => {
        reactState = 'ready';
        area.className = 'fullscreen-click-area ready';
        document.querySelector('.reaction-msg').innerText = "CLICK!";
        reactStart = performance.now();
    }, delay);
}

function handleReactionClick() {
    if (reactState === 'waiting') {
        reactState = 'result';
        clearTimeout(reactTimer);
        const area = document.getElementById('reaction-area');
        area.className = 'fullscreen-click-area result';
        document.querySelector('.reaction-msg').innerText = "TOO EARLY!";
        document.querySelector('.reaction-score').classList.add('hidden');
    } else if (reactState === 'ready') {
        const time = Math.floor(performance.now() - reactStart);
        reactState = 'result';
        const area = document.getElementById('reaction-area');
        area.className = 'fullscreen-click-area result';
        document.querySelector('.reaction-msg').innerText = "CLICK TO TRY AGAIN";
        const score = document.querySelector('.reaction-score');
        score.innerText = time + " ms";
        score.classList.remove('hidden');
    } else if (reactState === 'result') {
        resetReaction();
    }
}

// --- SEQUENCE ---

function initSequence() {
    document.getElementById('launch-sequence')?.addEventListener('click', () => {
        openOverlay('sequence-overlay');
        initSeqGrid();
    });
    document.getElementById('seq-start')?.addEventListener('click', startSequence);
}

function initSeqGrid() {
    const grid = document.getElementById('seq-grid');
    grid.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const btn = document.createElement('div');
        btn.className = 'seq-btn';
        btn.dataset.idx = i;
        btn.addEventListener('click', () => handleSeqInput(i));
        grid.appendChild(btn);
    }
}

function startSequence() {
    seqPattern = [];
    seqInput = [];
    seqLevel = 1;
    document.getElementById('seq-level').innerText = seqLevel;
    document.getElementById('seq-start').disabled = true;
    nextSeqRound();
}

function nextSeqRound() {
    seqInput = [];
    seqPlaying = true;
    seqPattern.push(Math.floor(Math.random() * 9));
    playSeqPattern();
}

async function playSeqPattern() {
    const btns = document.querySelectorAll('.seq-btn');
    await new Promise(r => setTimeout(r, 500));

    for (let idx of seqPattern) {
        btns[idx].classList.add('lit');
        await new Promise(r => setTimeout(r, 400));
        btns[idx].classList.remove('lit');
        await new Promise(r => setTimeout(r, 200));
    }
    seqPlaying = false;
}

function handleSeqInput(idx) {
    if (seqPlaying || seqPattern.length === 0) return;

    seqInput.push(idx);
    const btns = document.querySelectorAll('.seq-btn');

    btns[idx].classList.add('lit');
    setTimeout(() => btns[idx].classList.remove('lit'), 200);

    if (seqInput[seqInput.length - 1] !== seqPattern[seqInput.length - 1]) {
        btns[idx].classList.add('wrong');
        alert("GAME OVER! Level: " + seqLevel);
        document.getElementById('seq-start').disabled = false;
        seqPattern = [];
        return;
    }

    if (seqInput.length === seqPattern.length) {
        seqLevel++;
        document.getElementById('seq-level').innerText = seqLevel;
        setTimeout(nextSeqRound, 1000);
    }
}

// --- AIM TRAINER ---

function initAim() {
    document.getElementById('launch-aim')?.addEventListener('click', () => openOverlay('aim-overlay'));
    document.getElementById('aim-start')?.addEventListener('click', startAim);
}

function startAim() {
    aimCount = 0;
    aimActive = true;
    const area = document.getElementById('aim-area');
    area.innerHTML = '';
    document.getElementById('aim-count').textContent = '0';
    document.getElementById('aim-start').style.display = 'none';
    
    // Initial delay to avoid accidental click
    setTimeout(() => {
        aimStartTime = Date.now();
        spawnAimTarget();
        updateAimTimer();
    }, 100);
}

function spawnAimTarget() {
    if (aimCount >= 30) {
        endAim();
        return;
    }
    const area = document.getElementById('aim-area');
    const target = document.createElement('div');
    target.className = 'aim-target';
    
    // Ensure targets stay within bounds
    const x = Math.random() * (area.clientWidth - 45);
    const y = Math.random() * (area.clientHeight - 45);
    target.style.left = `${x}px`;
    target.style.top = `${y}px`;
    
    // Use click for better compatibility
    target.onclick = (e) => {
        e.stopPropagation();
        aimCount++;
        document.getElementById('aim-count').textContent = aimCount;
        target.remove();
        spawnAimTarget();
    };
    area.appendChild(target);
}

function updateAimTimer() {
    if (!aimActive) return;
    const elapsed = ((Date.now() - aimStartTime) / 1000).toFixed(2);
    document.getElementById('aim-time').textContent = elapsed;
    requestAnimationFrame(updateAimTimer);
}

function endAim() {
    aimActive = false;
    const elapsed = ((Date.now() - aimStartTime) / 1000).toFixed(2);
    const area = document.getElementById('aim-area');
    area.innerHTML = `<div class="aim-msg">FINISHED!<br>${elapsed}s<br>(${(elapsed/30*1000).toFixed(0)}ms/target)</div>`;
    document.getElementById('aim-start').style.display = 'block';
    document.getElementById('aim-start').textContent = 'RETRY';
}

// --- VERBAL MEMORY ---
const VERBAL_DICT = ["const", "let", "function", "array", "object", "string", "number", "boolean", "null", "undefined", "script", "style", "html", "body", "head", "meta", "div", "span", "img", "link", "input", "button", "form", "label", "react", "vue", "angular", "node", "npm", "git", "cloud", "api", "json", "rest", "hook", "state", "props", "effect", "query", "fetch", "c++", "rust", "go", "swift", "kotlin", "pixel", "retro", "dark", "mode", "light", "glass", "blur", "card", "grid", "flex", "box", "padding", "margin", "border", "radius", "font", "weight", "size", "color", "background"];

function initVerbal() {
    document.getElementById('launch-verbal')?.addEventListener('click', () => openOverlay('verbal-overlay'));
    document.getElementById('verbal-start')?.addEventListener('click', startVerbal);
    document.getElementById('verbal-seen')?.addEventListener('click', () => verbalAnswer(true));
    document.getElementById('verbal-new')?.addEventListener('click', () => verbalAnswer(false));
}

function startVerbal() {
    verbalScore = 0;
    verbalLives = 3;
    verbalSeenWords.clear();
    document.getElementById('verbal-score').textContent = '0';
    document.getElementById('verbal-lives').textContent = '3';
    document.getElementById('verbal-seen').disabled = false;
    document.getElementById('verbal-new').disabled = false;
    document.getElementById('verbal-start').style.display = 'none';
    nextVerbalWord();
}

function nextVerbalWord() {
    const isSeen = Math.random() < 0.45 && verbalSeenWords.size > 2;
    if (isSeen) {
        const words = Array.from(verbalSeenWords);
        verbalCurrentWord = words[Math.floor(Math.random() * words.length)];
    } else {
        // Find a word not currently in seen set for "New"
        let w;
        do { w = VERBAL_DICT[Math.floor(Math.random() * VERBAL_DICT.length)]; } while(verbalSeenWords.has(w));
        verbalCurrentWord = w;
    }
    document.getElementById('verbal-word').textContent = verbalCurrentWord;
    document.getElementById('verbal-word').style.opacity = 1;
}

function verbalAnswer(seen) {
    const wasSeen = verbalSeenWords.has(verbalCurrentWord);
    if (seen === wasSeen) {
        verbalScore++;
        document.getElementById('verbal-score').textContent = verbalScore;
    } else {
        verbalLives--;
        document.getElementById('verbal-lives').textContent = verbalLives;
        if (verbalLives <= 0) {
            document.getElementById('verbal-word').innerHTML = `GAME OVER<br>Score: ${verbalScore}`;
            document.getElementById('verbal-start').style.display = 'block';
            document.getElementById('verbal-start').textContent = 'RETRY';
            document.getElementById('verbal-seen').disabled = true;
            document.getElementById('verbal-new').disabled = true;
            return;
        }
    }
    verbalSeenWords.add(verbalCurrentWord);
    nextVerbalWord();
}

// --- VISUAL MEMORY ---

function initVisual() {
    document.getElementById('launch-visual')?.addEventListener('click', () => openOverlay('visual-overlay'));
    document.getElementById('visual-start')?.addEventListener('click', startVisual);
}

function startVisual() {
    visualLevel = 1;
    document.getElementById('visual-level').textContent = '1';
    document.getElementById('visual-start').style.display = 'none';
    nextVisualLevel();
}

function nextVisualLevel() {
    const grid = document.getElementById('visual-grid');
    grid.innerHTML = '';
    const size = visualLevel < 4 ? 3 : visualLevel < 8 ? 4 : 5;
    const count = 3 + visualLevel;
    visualPattern = [];
    visualUserPattern = [];
    visualCanClick = false;

    grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

    for (let i = 0; i < size * size; i++) {
        const cell = document.createElement('div');
        cell.className = 'visual-cell';
        cell.dataset.index = i;
        cell.onclick = () => clickVisual(cell);
        grid.appendChild(cell);
    }

    const indices = Array.from({length: size * size}, (_, i) => i);
    for (let i = 0; i < Math.min(count, size * size - 1); i++) {
        const idx = indices.splice(Math.floor(Math.random() * indices.length), 1)[0];
        visualPattern.push(idx);
    }

    // Flash pattern
    setTimeout(() => {
        visualPattern.forEach(idx => grid.children[idx].classList.add('active'));
        setTimeout(() => {
            visualPattern.forEach(idx => grid.children[idx].classList.remove('active'));
            visualCanClick = true;
        }, 1200 + (visualLevel * 100));
    }, 500);
}

function clickVisual(cell) {
    if (!visualCanClick) return;
    const idx = parseInt(cell.dataset.index);
    if (visualPattern.includes(idx)) {
        if (!visualUserPattern.includes(idx)) {
            visualUserPattern.push(idx);
            cell.classList.add('active');
            if (visualUserPattern.length === visualPattern.length) {
                visualCanClick = false;
                visualLevel++;
                document.getElementById('visual-level').textContent = visualLevel;
                setTimeout(nextVisualLevel, 800);
            }
        }
    } else {
        cell.style.background = '#ff4444';
        visualCanClick = false;
        setTimeout(() => {
            alert(`Game Over! Level: ${visualLevel}`);
            document.getElementById('visual-start').style.display = 'block';
            document.getElementById('visual-start').textContent = 'RETRY';
        }, 300);
    }
}

// --- NUMBER MEMORY ---

function initNumber() {
    document.getElementById('launch-number')?.addEventListener('click', () => openOverlay('number-overlay'));
    document.getElementById('number-start')?.addEventListener('click', startNumber);
    document.getElementById('number-submit')?.addEventListener('click', checkNumber);
    // Allow Enter key
    document.getElementById('number-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkNumber();
    });
}

function startNumber() {
    numberLevelCount = 1;
    document.getElementById('number-start').style.display = 'none';
    nextNumber();
}

function nextNumber() {
    document.getElementById('number-level').textContent = numberLevelCount;
    currentNumberVal = "";
    for (let i = 0; i < numberLevelCount; i++) {
        currentNumberVal += Math.floor(Math.random() * 10);
    }
    const display = document.getElementById('number-display');
    display.textContent = currentNumberVal;
    display.style.display = 'block';
    display.style.opacity = 1;
    document.getElementById('number-input').style.display = 'none';
    document.getElementById('number-submit').style.display = 'none';

    // Show duration based on length
    const duration = 1500 + (numberLevelCount * 800);
    setTimeout(() => {
        display.style.display = 'none';
        const input = document.getElementById('number-input');
        input.style.display = 'block';
        input.value = "";
        input.focus();
        document.getElementById('number-submit').style.display = 'inline-block';
    }, duration);
}

function checkNumber() {
    const userNum = document.getElementById('number-input').value;
    if (userNum === currentNumberVal) {
        numberLevelCount++;
        nextNumber();
    } else {
        document.getElementById('number-display').innerHTML = `WRONG!<br>Was: ${currentNumberVal}<br>Level: ${numberLevelCount}`;
        document.getElementById('number-display').style.display = 'block';
        document.getElementById('number-start').style.display = 'block';
        document.getElementById('number-start').textContent = 'RETRY';
        document.getElementById('number-submit').style.display = 'none';
        document.getElementById('number-input').style.display = 'none';
    }
}

// --- CHIMP TEST ---

function initChimp() {
    document.getElementById('launch-chimp')?.addEventListener('click', () => openOverlay('chimp-overlay'));
    document.getElementById('chimp-start')?.addEventListener('click', startChimp);
}

function startChimp() {
    chimpLevelCount = 4;
    document.getElementById('chimp-start').style.display = 'none';
    nextChimp();
}

function nextChimp() {
    document.getElementById('chimp-count').textContent = chimpLevelCount;
    const grid = document.getElementById('chimp-grid');
    grid.innerHTML = '';
    const size = chimpLevelCount < 10 ? 5 : 6;
    chimpNextNum = 1;
    grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    
    for (let i = 0; i < size * size; i++) {
        const cell = document.createElement('div');
        cell.className = 'visual-cell chimp';
        grid.appendChild(cell);
    }

    const indices = Array.from({length: size * size}, (_, i) => i);
    for (let i = 1; i <= chimpLevelCount; i++) {
        const idx = indices.splice(Math.floor(Math.random() * indices.length), 1)[0];
        const cell = grid.children[idx];
        cell.textContent = i;
        cell.classList.add('has-number');
        cell.onclick = () => clickChimp(cell, i);
    }
}

function clickChimp(cell, val) {
    if (val === chimpNextNum) {
        if (chimpNextNum === 1) {
            document.querySelectorAll('.visual-cell.chimp.has-number').forEach(c => c.classList.add('hidden-num'));
        }
        cell.classList.remove('has-number', 'hidden-num');
        cell.style.visibility = 'hidden';
        chimpNextNum++;
        if (chimpNextNum > chimpLevelCount) {
            chimpLevelCount++;
            setTimeout(nextChimp, 500);
        }
    } else {
        alert("MISCLICK! GAME OVER.");
        document.getElementById('chimp-start').style.display = 'block';
        document.getElementById('chimp-start').textContent = 'RETRY';
    }
}

// --- MENTAL MATH ---

function initMath() {
    document.getElementById('launch-math')?.addEventListener('click', () => openOverlay('math-overlay'));
    document.getElementById('math-start')?.addEventListener('click', startMath);
    document.getElementById('math-input')?.addEventListener('input', checkMath);
}

function startMath() {
    mathScoreCount = 0;
    mathTimeLeft = 60;
    document.getElementById('math-score').textContent = '0';
    document.getElementById('math-time').textContent = '60';
    document.getElementById('math-start').style.display = 'none';
    document.getElementById('math-input').disabled = false;
    document.getElementById('math-input').focus();
    nextMath();
    if (mathGlobalTimer) clearInterval(mathGlobalTimer);
    mathGlobalTimer = setInterval(() => {
        mathTimeLeft--;
        document.getElementById('math-time').textContent = mathTimeLeft;
        if (mathTimeLeft <= 0) {
            clearInterval(mathGlobalTimer);
            document.getElementById('math-problem').innerHTML = `TIME UP!<br>Score: ${mathScoreCount}`;
            document.getElementById('math-start').style.display = 'block';
            document.getElementById('math-start').textContent = 'RETRY';
            document.getElementById('math-input').disabled = true;
        }
    }, 1000);
}

function nextMath() {
    const level = Math.floor(mathScoreCount / 5);
    const range = 10 + (level * 10);
    const a = Math.floor(Math.random() * range) + 2;
    const b = Math.floor(Math.random() * (level > 2 ? range : 12)) + 2;
    const ops = level < 2 ? ['+'] : level < 5 ? ['+', '-'] : ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    
    if (op === '+') {
        mathCurrentAns = a + b;
        document.getElementById('math-problem').textContent = `${a} + ${b}`;
    } else if (op === '-') {
        mathCurrentAns = a - b;
        document.getElementById('math-problem').textContent = `${a} - ${b}`;
    } else {
        mathCurrentAns = a * b;
        document.getElementById('math-problem').textContent = `${a} × ${b}`;
    }
    document.getElementById('math-input').value = '';
}

function checkMath() {
    if (parseInt(document.getElementById('math-input').value) === mathCurrentAns) {
        mathScoreCount++;
        document.getElementById('math-score').textContent = mathScoreCount;
        nextMath();
    }
}

// --- STROOP TEST ---
const STROOP_COLORS_LIST = ['red', 'green', 'blue', 'yellow'];

function initStroop() {
    document.getElementById('launch-stroop')?.addEventListener('click', () => openOverlay('stroop-overlay'));
    document.getElementById('stroop-start')?.addEventListener('click', startStroop);
    document.querySelectorAll('#stroop-buttons button').forEach(btn => {
        btn.onclick = () => checkStroop(btn.dataset.color);
    });
}

function startStroop() {
    stroopScoreCount = 0;
    stroopTimeLeft = 30;
    document.getElementById('stroop-score').textContent = '0';
    document.getElementById('stroop-time').textContent = '30';
    document.getElementById('stroop-start').style.display = 'none';
    document.querySelectorAll('#stroop-buttons button').forEach(btn => btn.disabled = false);
    nextStroop();
    if (stroopGlobalTimer) clearInterval(stroopGlobalTimer);
    stroopGlobalTimer = setInterval(() => {
        stroopTimeLeft--;
        document.getElementById('stroop-time').textContent = stroopTimeLeft;
        if (stroopTimeLeft <= 0) {
            clearInterval(stroopGlobalTimer);
            document.getElementById('stroop-word').innerHTML = `FINISHED<br>Score: ${stroopScoreCount}`;
            document.getElementById('stroop-start').style.display = 'block';
            document.getElementById('stroop-start').textContent = 'RETRY';
            document.querySelectorAll('#stroop-buttons button').forEach(btn => btn.disabled = true);
        }
    }, 1000);
}

function nextStroop() {
    const textIdx = Math.floor(Math.random() * STROOP_COLORS_LIST.length);
    const colorIdx = Math.floor(Math.random() * STROOP_COLORS_LIST.length);
    const word = document.getElementById('stroop-word');
    word.textContent = STROOP_COLORS_LIST[textIdx].toUpperCase();
    word.style.color = STROOP_COLORS_LIST[colorIdx];
    word.dataset.ans = STROOP_COLORS_LIST[colorIdx];
}

function checkStroop(color) {
    if (color === document.getElementById('stroop-word').dataset.ans) {
        stroopScoreCount++;
        document.getElementById('stroop-score').textContent = stroopScoreCount;
        nextStroop();
    } else {
        // Subtle penalty? 
        stroopTimeLeft = Math.max(0, stroopTimeLeft - 1);
        nextStroop();
    }
}

// --- GRID 1-20 ---

function initGrid() {
    document.getElementById('launch-grid')?.addEventListener('click', () => openOverlay('grid-overlay'));
    document.getElementById('grid-start')?.addEventListener('click', startGrid);
}

function startGrid() {
    gridNextVal = 1;
    gridGameActive = true;
    document.getElementById('grid-next').textContent = '1';
    document.getElementById('grid-start').style.display = 'none';
    const box = document.getElementById('grid-box');
    box.innerHTML = '';
    box.style.gridTemplateColumns = 'repeat(5, 1fr)';
    const nums = Array.from({length: 20}, (_, i) => i + 1);
    nums.sort(() => Math.random() - 0.5);
    
    nums.forEach(n => {
        const btn = document.createElement('div');
        btn.className = 'grid-num';
        btn.textContent = n;
        btn.onclick = () => {
            if (n === gridNextVal) {
                btn.style.background = '#222';
                btn.style.color = '#444';
                btn.style.pointerEvents = 'none';
                gridNextVal++;
                document.getElementById('grid-next').textContent = gridNextVal > 20 ? 'DONE' : gridNextVal;
                if (gridNextVal > 20) {
                    gridGameActive = false;
                    const elapsed = ((Date.now() - gridStartTimestamp) / 1000).toFixed(2);
                    alert(`COMPLETED! Time: ${elapsed}s`);
                    document.getElementById('grid-start').style.display = 'block';
                    document.getElementById('grid-start').textContent = 'RETRY';
                }
            }
        };
        box.appendChild(btn);
    });
    gridStartTimestamp = Date.now();
    updateGridTimer();
}

function updateGridTimer() {
    if (!gridGameActive) return;
    const elapsed = ((Date.now() - gridStartTimestamp) / 1000).toFixed(1);
    document.getElementById('grid-time').textContent = elapsed;
    requestAnimationFrame(updateGridTimer);
}

// --- COLOR FINDER ---

function initColor() {
    document.getElementById('launch-color')?.addEventListener('click', () => openOverlay('color-overlay'));
    document.getElementById('color-start')?.addEventListener('click', startColor);
}

function startColor() {
    colorScoreTotal = 0;
    colorSecondsLeft = 15;
    document.getElementById('color-score').textContent = '0';
    document.getElementById('color-time').textContent = '15';
    document.getElementById('color-start').style.display = 'none';
    nextColor();
    if (colorMainTimer) clearInterval(colorMainTimer);
    colorMainTimer = setInterval(() => {
        colorSecondsLeft--;
        document.getElementById('color-time').textContent = colorSecondsLeft;
        if (colorSecondsLeft <= 0) {
            clearInterval(colorMainTimer);
            document.getElementById('color-grid').innerHTML = `<div style="font-size: 32px; font-weight: 800;">TIME UP!<br>Score: ${colorScoreTotal}</div>`;
            document.getElementById('color-start').style.display = 'block';
            document.getElementById('color-start').textContent = 'RETRY';
        }
    }, 1000);
}

function nextColor() {
    const grid = document.getElementById('color-grid');
    grid.innerHTML = '';
    const size = colorScoreTotal < 4 ? 2 : colorScoreTotal < 10 ? 3 : colorScoreTotal < 20 ? 4 : 5;
    grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    
    const h = Math.floor(Math.random() * 360);
    const s = 60;
    const l = 50;
    // Difficulty curve
    const diff = Math.max(1, 15 - Math.floor(colorScoreTotal / 2));
    const oddIdx = Math.floor(Math.random() * (size * size));

    for (let i = 0; i < size * size; i++) {
        const cell = document.createElement('div');
        cell.className = 'color-cell';
        cell.style.background = `hsl(${h}, ${s}%, ${i === oddIdx ? l + diff : l}%)`;
        cell.onclick = () => {
            if (i === oddIdx) {
                colorScoreTotal++;
                document.getElementById('color-score').textContent = colorScoreTotal;
                nextColor();
            } else {
                colorSecondsLeft = Math.max(0, colorSecondsLeft - 2);
            }
        };
        grid.appendChild(cell);
    }
}

// --- MEMORY FLIP ---

function initFlip() {
    document.getElementById('launch-flip')?.addEventListener('click', () => openOverlay('flip-overlay'));
    document.getElementById('flip-start')?.addEventListener('click', startFlip);
}

function startFlip() {
    flipMovesTotal = 0;
    flipCurrentActive = [];
    document.getElementById('flip-moves').textContent = '0';
    document.getElementById('flip-start').style.display = 'none';
    const grid = document.getElementById('flip-grid');
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    
    const icons = ['bolt', 'heart', 'star', 'sun', 'moon', 'cloud', 'leaf', 'fire'];
    const deck = [...icons, ...icons].sort(() => Math.random() - 0.5);
    
    deck.forEach((icon, idx) => {
        const card = document.createElement('div');
        card.className = 'flip-card';
        card.innerHTML = `<i class="fas fa-${icon}"></i>`;
        card.onclick = () => clickFlip(card, icon);
        grid.appendChild(card);
    });
}

function clickFlip(card, icon) {
    if (card.classList.contains('flipped') || flipCurrentActive.length === 2) return;
    
    card.classList.add('flipped');
    flipCurrentActive.push({card, icon});
    
    if (flipCurrentActive.length === 2) {
        flipMovesTotal++;
        document.getElementById('flip-moves').textContent = flipMovesTotal;
        if (flipCurrentActive[0].icon === flipCurrentActive[1].icon) {
            flipCurrentActive = [];
            if (document.querySelectorAll('.flipped').length === flipPairsNeeded * 2) {
                setTimeout(() => {
                    alert(`EXCELLENT! Finished in ${flipMovesTotal} moves.`);
                    document.getElementById('flip-start').style.display = 'block';
                    document.getElementById('flip-start').textContent = 'RETRY';
                }, 500);
            }
        } else {
            setTimeout(() => {
                flipCurrentActive.forEach(i => i.card.classList.remove('flipped'));
                flipCurrentActive = [];
            }, 700);
        }
    }
}


// Initialization is handled at the top of the file via initAllGames()

