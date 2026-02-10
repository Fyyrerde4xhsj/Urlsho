// Game Database remains untouched
const WORD_DATABASE = {
    nature: ["TREE", "MOUNTAIN", "RIVER", "FOREST", "FLOWER", "SKY", "OCEAN", "DESERT", "CLOUD", "STORM"],
    space: ["PLANET", "STAR", "GALAXY", "COMET", "MOON", "ORBIT", "NASA", "SPACE", "ROVER", "ALIEN"],
    tech: ["CODE", "JAVA", "HTML", "DATA", "CHIP", "WEB", "BYTE", "CLOUDS", "ROBOT", "LOGIC"]
};

class WordSearch {
    constructor() {
        this.currentLevel = parseInt(localStorage.getItem('ws_level')) || 1;
        this.score = parseInt(localStorage.getItem('ws_score')) || 0;
        this.mistakes = 0;
        this.time = 0;
        this.timer = null;
        this.foundWords = [];
        this.selectedCells = [];
        this.grid = [];
        this.wordsToFind = [];
        this.hintsAvailable = 0;
        this.difficultyScaling = 0;

        this.initElements();
        this.bindEvents();
        this.loadLevel();
    }

    initElements() {
        this.gridEl = document.getElementById('word-grid');
        this.wordListEl = document.getElementById('word-list');
        this.timerEl = document.getElementById('timer-display');
        this.levelEl = document.getElementById('level-display');
        this.scoreEl = document.getElementById('score-display');
        this.progressBar = document.getElementById('progress-bar');
        this.hintBtn = document.getElementById('hint-btn');
    }

    // Logic untouched - Level configuration
    getLevelConfig() {
        const level = this.currentLevel;
        if (level <= 5) return { size: 6, count: 3 + this.difficultyScaling, directions: ['H', 'V'], backward: false, timer: null, hints: 0 };
        if (level <= 10) return { size: 8, count: 5 + this.difficultyScaling, directions: ['H', 'V', 'D'], backward: false, timer: 120, hints: 2 };
        return { size: 10, count: 7 + this.difficultyScaling, directions: ['H', 'V', 'D'], backward: true, timer: 60, hints: 1 };
    }

    loadLevel() {
        // UI Reset
        document.getElementById('level-modal').classList.add('hidden');
        document.getElementById('levelAd').classList.add('hidden'); // AD Hidden on level start
        
        const config = this.getLevelConfig();
        this.wordsToFind = this.generateWordList(config.count);
        this.foundWords = [];
        this.mistakes = 0;
        this.time = config.timer || 0;
        this.hintsAvailable = config.hints;
        
        this.generateGrid(config);
        this.renderGrid();
        this.renderWordList();
        this.startTimer(config.timer);
        this.updateUI();
    }

    // ... generateWordList, generateGrid, canPlaceWord, placeWord methods remain identical ...
    // [Keeping previous implementation logic exactly as requested]

    generateWordList(count) {
        const categories = Object.keys(WORD_DATABASE);
        const cat = categories[Math.floor(Math.random() * categories.length)];
        return [...WORD_DATABASE[cat]].sort(() => Math.random() - 0.5).slice(0, Math.min(count, 10));
    }

    generateGrid(config) {
        const { size, directions, backward } = config;
        this.grid = Array(size).fill().map(() => Array(size).fill(''));
        this.wordsToFind.forEach(word => {
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 100) {
                const dir = directions[Math.floor(Math.random() * directions.length)];
                const isBack = backward && Math.random() > 0.5;
                const wordStr = isBack ? word.split('').reverse().join('') : word;
                const r = Math.floor(Math.random() * size);
                const c = Math.floor(Math.random() * size);
                if (this.canPlaceWord(wordStr, r, c, dir, size)) {
                    this.placeWord(wordStr, r, c, dir);
                    placed = true;
                }
                attempts++;
            }
        });
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for(let i=0; i<size; i++) 
            for(let j=0; j<size; j++) 
                if(!this.grid[i][j]) this.grid[i][j] = chars[Math.floor(Math.random()*26)];
    }

    canPlaceWord(word, r, c, dir, size) {
        const dr = dir === 'V' ? 1 : dir === 'D' ? 1 : 0;
        const dc = dir === 'H' ? 1 : dir === 'D' ? 1 : 0;
        if (r + dr * word.length > size || c + dc * word.length > size) return false;
        for (let i = 0; i < word.length; i++) {
            const char = this.grid[r + i * dr][c + i * dc];
            if (char !== '' && char !== word[i]) return false;
        }
        return true;
    }

    placeWord(word, r, c, dir) {
        const dr = dir === 'V' ? 1 : dir === 'D' ? 1 : 0;
        const dc = dir === 'H' ? 1 : dir === 'D' ? 1 : 0;
        for (let i = 0; i < word.length; i++) this.grid[r + i * dr][c + i * dc] = word[i];
    }

    renderGrid() {
        this.gridEl.style.gridTemplateColumns = `repeat(${this.grid.length}, 1fr)`;
        this.gridEl.innerHTML = '';
        this.grid.forEach((row, r) => {
            row.forEach((char, c) => {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.textContent = char;
                cell.dataset.r = r;
                cell.dataset.c = c;
                this.gridEl.appendChild(cell);
            });
        });
    }

    bindEvents() {
        let isSelecting = false;
        const handleStart = (e) => {
            isSelecting = true;
            this.selectedCells = [];
            handleMove(e);
        };
        const handleMove = (e) => {
            if (!isSelecting) return;
            const point = e.touches ? e.touches[0] : e;
            const el = document.elementFromPoint(point.clientX, point.clientY);
            if (el && el.classList.contains('cell') && !this.selectedCells.includes(el)) {
                el.classList.add('selected');
                this.selectedCells.push(el);
            }
        };
        const handleEnd = () => {
            if (!isSelecting) return;
            isSelecting = false;
            this.checkSelection();
        };

        this.gridEl.addEventListener('mousedown', handleStart);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
        this.gridEl.addEventListener('touchstart', (e) => { e.preventDefault(); handleStart(e); });
        window.addEventListener('touchmove', (e) => { e.preventDefault(); handleMove(e); });
        window.addEventListener('touchend', handleEnd);

        document.getElementById('next-level-btn').onclick = () => {
            this.currentLevel++;
            localStorage.setItem('ws_level', this.currentLevel);
            this.loadLevel();
        };
    }

    checkSelection() {
        const selectedWord = this.selectedCells.map(c => c.textContent).join('');
        const reversedWord = selectedWord.split('').reverse().join('');
        const match = this.wordsToFind.find(w => (w === selectedWord || w === reversedWord) && !this.foundWords.includes(w));

        if (match) {
            this.foundWords.push(match);
            this.selectedCells.forEach(c => {
                c.classList.remove('selected');
                c.classList.add('found');
            });
            this.score += 100;
            this.updateUI();
            if (this.foundWords.length === this.wordsToFind.length) this.levelComplete();
        } else {
            // UI Change: Add shake animation on mistake
            this.selectedCells.forEach(c => {
                c.classList.add('shake');
                setTimeout(() => c.classList.remove('shake', 'selected'), 400);
            });
            this.mistakes++;
        }
        this.selectedCells = [];
    }

    startTimer(duration) {
        clearInterval(this.timer);
        this.timer = setInterval(() => {
            if (duration === null) this.time++;
            else {
                this.time--;
                if (this.time < 15) document.getElementById('timer-container').classList.add('pulse');
                if (this.time <= 0) {
                    clearInterval(this.timer);
                    this.difficultyScaling = Math.max(-2, this.difficultyScaling - 1);
                    this.loadLevel();
                }
            }
            this.updateTimerDisplay();
        }, 1000);
    }

    updateUI() {
        this.levelEl.textContent = this.currentLevel;
        this.scoreEl.textContent = this.score;
        const progress = (this.foundWords.length / this.wordsToFind.length) * 100;
        this.progressBar.style.width = `${progress}%`;
        this.renderWordList();
    }

    renderWordList() {
        this.wordListEl.innerHTML = '';
        this.wordsToFind.forEach(word => {
            const span = document.createElement('span');
            span.className = `word-item ${this.foundWords.includes(word) ? 'found' : ''}`;
            span.textContent = word;
            this.wordListEl.appendChild(span);
        });
    }

    updateTimerDisplay() {
        const m = Math.floor(Math.abs(this.time) / 60);
        const s = Math.abs(this.time) % 60;
        this.timerEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    levelComplete() {
        clearInterval(this.timer);
        
        // Populate Modal Stats
        document.getElementById('stat-time').textContent = this.timerEl.textContent;
        document.getElementById('stat-mistakes').textContent = this.mistakes;
        document.getElementById('stat-points').textContent = `+${this.foundWords.length * 50}`;
        
        // UI Action: Show Modal and Show Level Ad
        document.getElementById('level-modal').classList.remove('hidden');
        document.getElementById('levelAd').classList.remove('hidden'); 
        
        // Interstitial Ad trigger (Console log for logic verification)
        if (this.currentLevel % 3 === 0) {
            console.log("AD LOGIC: Triggering Interstitial Overlay...");
        }
    }
}

new WordSearch();