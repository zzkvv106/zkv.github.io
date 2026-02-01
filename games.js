/* --- Games Logic Hub --- */

// --- Shared Utilities ---
function closeAllOverlays() {
    document.querySelectorAll('.game-overlay').forEach(el => el.style.display = 'none');
}

function openOverlay(id) {
    closeAllOverlays();
    const el = document.getElementById(id);
    if (el) {
        el.style.display = 'flex';
    }
}

// Ensure overlays are hidden on load
document.addEventListener('DOMContentLoaded', () => {
    closeAllOverlays();

    // Attach close buttons
    document.querySelectorAll('.close-game-btn').forEach(btn => {
        btn.addEventListener('click', closeAllOverlays);
    });
});


// --- BLACKJACK ---
const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
let bjDeck = [], bjPlayer = [], bjDealer = [], bjActive = false;

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
let typerWords = [], typerIndex = 0, typerTime = 30, typerTimer = null, typerActive = false, typerCorrect = 0;

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
let mGrid = [], mGameOver = false, mTime = 0, mTimer = null;

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

// --- 2048 ---
let squares2048 = [];
let score2048 = 0;
const width2048 = 4;

function init2048() {
    document.getElementById('launch-2048')?.addEventListener('click', () => {
        openOverlay('2048-overlay');
        start2048();
    });
    document.getElementById('2048-reset')?.addEventListener('click', start2048);
}

function start2048() {
    const gridDisplay = document.getElementById('2048-grid');
    gridDisplay.innerHTML = '';
    squares2048 = [];
    score2048 = 0;
    document.getElementById('2048-score').textContent = '0';

    for (let i = 0; i < width2048 * width2048; i++) {
        const square = document.createElement("div");
        square.className = 't2048-cell';
        square.innerHTML = '';
        gridDisplay.appendChild(square);
        squares2048.push(square);
    }
    generate2048();
    generate2048();
    addColours2048();

    if (window.timer2048) clearInterval(window.timer2048);
    window.timer2048 = setInterval(addColours2048, 50);
}

function generate2048() {
    const randomNumber = Math.floor(Math.random() * squares2048.length);
    if (squares2048[randomNumber].innerHTML == '' || squares2048[randomNumber].innerHTML == 0) {
        squares2048[randomNumber].innerHTML = 2;
        checkForGameOver2048();
    } else generate2048();
}

function moveRight2048() {
    for (let i = 0; i < 16; i++) {
        if (i % 4 === 0) {
            let totalOne = squares2048[i].innerHTML;
            let totalTwo = squares2048[i + 1].innerHTML;
            let totalThree = squares2048[i + 2].innerHTML;
            let totalFour = squares2048[i + 3].innerHTML;
            let row = [parseInt(totalOne), parseInt(totalTwo), parseInt(totalThree), parseInt(totalFour)];

            let filteredRow = row.filter(num => num);
            let missing = 4 - filteredRow.length;
            let zeros = Array(missing).fill(0);
            let newRow = zeros.concat(filteredRow);

            squares2048[i].innerHTML = newRow[0];
            squares2048[i + 1].innerHTML = newRow[1];
            squares2048[i + 2].innerHTML = newRow[2];
            squares2048[i + 3].innerHTML = newRow[3];
        }
    }
}

function moveLeft2048() {
    for (let i = 0; i < 16; i++) {
        if (i % 4 === 0) {
            let totalOne = squares2048[i].innerHTML;
            let totalTwo = squares2048[i + 1].innerHTML;
            let totalThree = squares2048[i + 2].innerHTML;
            let totalFour = squares2048[i + 3].innerHTML;
            let row = [parseInt(totalOne), parseInt(totalTwo), parseInt(totalThree), parseInt(totalFour)];

            let filteredRow = row.filter(num => num);
            let missing = 4 - filteredRow.length;
            let zeros = Array(missing).fill(0);
            let newRow = filteredRow.concat(zeros);

            squares2048[i].innerHTML = newRow[0] || '';
            squares2048[i + 1].innerHTML = newRow[1] || '';
            squares2048[i + 2].innerHTML = newRow[2] || '';
            squares2048[i + 3].innerHTML = newRow[3] || '';
        }
    }
}

function moveUp2048() {
    for (let i = 0; i < 4; i++) {
        let totalOne = squares2048[i].innerHTML;
        let totalTwo = squares2048[i + width2048].innerHTML;
        let totalThree = squares2048[i + width2048 * 2].innerHTML;
        let totalFour = squares2048[i + width2048 * 3].innerHTML;
        let column = [parseInt(totalOne), parseInt(totalTwo), parseInt(totalThree), parseInt(totalFour)];

        let filteredColumn = column.filter(num => num);
        let missing = 4 - filteredColumn.length;
        let zeros = Array(missing).fill(0);
        let newColumn = filteredColumn.concat(zeros);

        squares2048[i].innerHTML = newColumn[0] || '';
        squares2048[i + width2048].innerHTML = newColumn[1] || '';
        squares2048[i + width2048 * 2].innerHTML = newColumn[2] || '';
        squares2048[i + width2048 * 3].innerHTML = newColumn[3] || '';
    }
}

function moveDown2048() {
    for (let i = 0; i < 4; i++) {
        let totalOne = squares2048[i].innerHTML;
        let totalTwo = squares2048[i + width2048].innerHTML;
        let totalThree = squares2048[i + width2048 * 2].innerHTML;
        let totalFour = squares2048[i + width2048 * 3].innerHTML;
        let column = [parseInt(totalOne), parseInt(totalTwo), parseInt(totalThree), parseInt(totalFour)];

        let filteredColumn = column.filter(num => num);
        let missing = 4 - filteredColumn.length;
        let zeros = Array(missing).fill(0);
        let newColumn = zeros.concat(filteredColumn);

        squares2048[i].innerHTML = newColumn[0];
        squares2048[i + width2048].innerHTML = newColumn[1];
        squares2048[i + width2048 * 2].innerHTML = newColumn[2];
        squares2048[i + width2048 * 3].innerHTML = newColumn[3];
    }
}

function combineRow2048() {
    for (let i = 0; i < 15; i++) {
        if (squares2048[i].innerHTML === squares2048[i + 1].innerHTML) {
            let combinedTotal = parseInt(squares2048[i].innerHTML) + parseInt(squares2048[i + 1].innerHTML);
            squares2048[i].innerHTML = combinedTotal;
            squares2048[i + 1].innerHTML = 0;
            score2048 += combinedTotal;
            document.getElementById('2048-score').textContent = score2048;
        }
    }
    checkForWin2048();
}

function combineColumn2048() {
    for (let i = 0; i < 12; i++) {
        if (squares2048[i].innerHTML === squares2048[i + width2048].innerHTML) {
            let combinedTotal = parseInt(squares2048[i].innerHTML) + parseInt(squares2048[i + width2048].innerHTML);
            squares2048[i].innerHTML = combinedTotal;
            squares2048[i + width2048].innerHTML = 0;
            score2048 += combinedTotal;
            document.getElementById('2048-score').textContent = score2048;
        }
    }
    checkForWin2048();
}

function control2048(e) {
    if (document.getElementById('2048-overlay').style.display === 'none') return;

    if (e.key === "ArrowLeft") {
        e.preventDefault();
        keyLeft2048();
    } else if (e.key === "ArrowRight") {
        e.preventDefault();
        keyRight2048();
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        keyUp2048();
    } else if (e.key === "ArrowDown") {
        e.preventDefault();
        keyDown2048();
    }
}
document.addEventListener("keydown", control2048);

function keyLeft2048() {
    moveLeft2048();
    combineRow2048();
    moveLeft2048();
    generate2048();
}

function keyRight2048() {
    moveRight2048();
    combineRow2048();
    moveRight2048();
    generate2048();
}

function keyUp2048() {
    moveUp2048();
    combineColumn2048();
    moveUp2048();
    generate2048();
}

function keyDown2048() {
    moveDown2048();
    combineColumn2048();
    moveDown2048();
    generate2048();
}

function checkForWin2048() {
    for (let i = 0; i < squares2048.length; i++) {
        if (squares2048[i].innerHTML == 2048) {
            setTimeout(() => alert("You WIN!"), 100);
        }
    }
}

function checkForGameOver2048() {
    let zeros = 0;
    for (let i = 0; i < squares2048.length; i++) {
        if (squares2048[i].innerHTML == '' || squares2048[i].innerHTML == 0) {
            zeros++;
        }
    }
    if (zeros === 0) {
        setTimeout(() => alert("You LOSE!"), 100);
    }
}

function addColours2048() {
    for (let i = 0; i < squares2048.length; i++) {
        const val = squares2048[i].innerHTML;
        if (val == '' || val == 0) squares2048[i].style.backgroundColor = "#afa192";
        else if (val == 2) squares2048[i].style.backgroundColor = "#eee4da";
        else if (val == 4) squares2048[i].style.backgroundColor = "#ede0c8";
        else if (val == 8) squares2048[i].style.backgroundColor = "#f2b179";
        else if (val == 16) squares2048[i].style.backgroundColor = "#ffcea4";
        else if (val == 32) squares2048[i].style.backgroundColor = "#e8c064";
        else if (val == 64) squares2048[i].style.backgroundColor = "#ffab6e";
        else if (val == 128) squares2048[i].style.backgroundColor = "#fd9982";
        else if (val == 256) squares2048[i].style.backgroundColor = "#ead79c";
        else if (val == 512) squares2048[i].style.backgroundColor = "#76daff";
        else if (val == 1024) squares2048[i].style.backgroundColor = "#beeaa5";
        else if (val == 2048) squares2048[i].style.backgroundColor = "#d7d4f0";
        else squares2048[i].style.backgroundColor = "#cdc1b4";
    }
}

// --- REACTION ---
let reactState = 'idle';
let reactTimer = null;
let reactStart = 0;

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
let seqPattern = [], seqInput = [], seqLevel = 1, seqPlaying = false;

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


// --- INIT ALL ---
document.addEventListener('DOMContentLoaded', () => {
    initBlackjack();
    initTyper();
    initMines();
    init2048();
    initReaction();
    initSequence();
});
