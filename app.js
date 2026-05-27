/**
 * Character Quiz Game - Vanilla JS App
 */

const CATEGORIES = ['Slut', 'Twink', 'Shemale'];

// --- Helpers ---
function getProxiedUrl(url) {
    if (!url) return '';
    return url;
}

function cleanPerformerName(name) {
    if (!name) return '';
    return name
        .replace(/\b(?:nude|pics|photos|videos|pic|photo|video|bio|profile|pornstar|porn\s+star)\b/gi, '')
        .replace(/&/g, '')
        .replace(/,/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// --- Data Store ---
class DataStore {
    constructor() {
        this.characters = [];
        this.highScores = JSON.parse(localStorage.getItem('charquiz_scores')) || {
            All: { score: 0, streak: 0 },
            Slut: { score: 0, streak: 0 },
            Twink: { score: 0, streak: 0 },
            Shemale: { score: 0, streak: 0 }
        };
        this.customLabels = JSON.parse(localStorage.getItem('charquiz_custom_labels')) || ['milf', 'teen', 'legend'];
        this.STORAGE_KEY = 'charquiz_characters';
    }

    saveLabels() {
        localStorage.setItem('charquiz_custom_labels', JSON.stringify(this.customLabels));
    }

    addLabel(label) {
        const clean = label.trim().toLowerCase();
        if (clean && !this.customLabels.includes(clean)) {
            this.customLabels.push(clean);
            this.saveLabels();
            return true;
        }
        return false;
    }

    deleteLabel(label) {
        this.customLabels = this.customLabels.filter(l => l !== label);
        this.saveLabels();
    }

    saveCharacters() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.characters));
    }

    loadCharacters() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    this.characters = parsed;
                    return;
                }
            } catch (e) {
                console.error('Failed to parse stored characters:', e);
            }
        }
        const dummyScript = document.getElementById('dummy-characters');
        if (dummyScript) {
            try {
                this.characters = JSON.parse(dummyScript.textContent);
                this.saveCharacters();
            } catch (e) {
                console.error('Failed to load dummy data:', e);
            }
        }
    }

    clearAll() {
        this.characters = [];
        this.saveCharacters();
    }

    saveScores() {
        localStorage.setItem('charquiz_scores', JSON.stringify(this.highScores));
    }

    getCharacters(category = 'All') {
        if (category === 'All' || category === 'Mix') return this.characters;
        return this.characters.filter(c => c.category === category);
    }

    addCharacter(name, category, photoUrl, labels = []) {
        // --- Bug #8 Fix: guard against duplicate names ---
        const normalizedName = name.trim().toLowerCase();
        if (this.characters.some(c => c.name.toLowerCase() === normalizedName)) {
            throw new Error(`"${name.trim()}" already exists in your collection.`);
        }
        const id = 'char-' + name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const newChar = { id, name: name.trim(), category, photoUrl: photoUrl.trim(), labels };
        this.characters.push(newChar);
        this.saveCharacters();
        return newChar;
    }

    updateCharacter(id, name, category, photoUrl, labels = []) {
        const updated = { id, name: name.trim(), category, photoUrl: photoUrl.trim(), labels };
        const index = this.characters.findIndex(c => c.id === id);
        if (index !== -1) {
            this.characters[index] = updated;
            this.saveCharacters();
        }
        return updated;
    }

    deleteCharacter(id) {
        this.characters = this.characters.filter(c => c.id !== id);
        this.saveCharacters();
    }

    updateHighScore(category, score, streak) {
        let isNewHigh = false;
        let cat = category === 'Mix' ? 'All' : category;
        if (!this.highScores[cat]) {
            this.highScores[cat] = { score: 0, streak: 0 };
        }
        
        if (score > this.highScores[cat].score) {
            this.highScores[cat].score = score;
            isNewHigh = true;
        }
        if (streak > this.highScores[cat].streak) {
            this.highScores[cat].streak = streak;
        }
        this.saveScores();
        return { isNewHigh, record: this.highScores[cat] };
    }

    exportData() {
        const dataStr = JSON.stringify(this.characters, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'charquiz_backup.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    importData(file, onComplete, onError) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (!Array.isArray(imported)) throw new Error("Invalid JSON format");
                
                let added = 0;
                for (const char of imported) {
                    if (char.name && char.category && char.photoUrl) {
                        const normalizedName = char.name.trim().toLowerCase();
                        if (!this.characters.some(c => c.name.toLowerCase() === normalizedName)) {
                            const id = 'char-' + char.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                            this.characters.push({
                                id: char.id || id,
                                name: char.name.trim(),
                                category: char.category,
                                photoUrl: char.photoUrl.trim(),
                                labels: Array.isArray(char.labels) ? char.labels : []
                            });
                            added++;
                        }
                    }
                }
                this.saveCharacters();
                onComplete(added);
            } catch (err) {
                onError(err);
            }
        };
        reader.readAsText(file);
    }
}

// --- Confetti Effect ---
const Confetti = {
    canvas: null,
    ctx: null,
    particles: [],
    animId: null,
    
    init() {
        this.canvas = document.getElementById('confettiCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    },
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },
    
    fire() {
        this.canvas.classList.remove('hidden');
        this.particles = [];
        const colors = ['#6366f1', '#10b981', '#ef4444', '#f59e0b', '#ec4899'];
        for (let i = 0; i < 150; i++) {
            this.particles.push({
                x: this.canvas.width / 2,
                y: this.canvas.height / 2 + 100,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 1) * 20 - 5,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rot: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 10
            });
        }
        
        if (this.animId) cancelAnimationFrame(this.animId);
        this.loop();
        
        setTimeout(() => {
            this.stop();
        }, 4000);
    },
    
    loop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.5; // gravity
            p.rot += p.rotSpeed;
            
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rot * Math.PI / 180);
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            this.ctx.restore();
            
            // Remove off-screen particles
            if (p.y > this.canvas.height) this.particles.splice(i, 1);
        });
        
        if (this.particles.length > 0) {
            this.animId = requestAnimationFrame(() => this.loop());
        } else {
            this.canvas.classList.add('hidden');
        }
    },
    
    stop() {
        this.particles = [];
        this.canvas.classList.add('hidden');
        if (this.animId) cancelAnimationFrame(this.animId);
    }
};

// --- Game Engine ---
class GameEngine {
    constructor(dataStore, uiManager) {
        this.store = dataStore;
        this.ui = uiManager;
        this.reset();
    }

    reset() {
        this.state = {
            category: null,
            maxRounds: 10,
            currentRound: 0,
            score: 0,
            streak: 0,
            maxStreak: 0,
            mistakes: [],
            availablePool: [], // characters remaining to be correct answers
            fullPool: [], // all characters in category for options
            currentQuestion: null,
            isActive: false
        };
    }

    start(category, roundsStr) {
        this.reset();
        this.state.category = category;
        this.state.fullPool = this.store.getCharacters(category);
        this.state.availablePool = [...this.state.fullPool];
        
        if (this.state.fullPool.length < 3) {
            this.ui.showToast('Not enough characters in this category. Minimum 3 required.', 'error');
            return false;
        }

        // Shuffle pool
        this.state.availablePool.sort(() => Math.random() - 0.5);
        
        if (roundsStr === 'Infinite') {
            this.state.maxRounds = Infinity;
        } else {
            this.state.maxRounds = parseInt(roundsStr);
        }

        this.state.isActive = true;
        this.ui.navigate('game');
        this.nextRound();
        return true;
    }

    nextRound() {
        if (!this.state.isActive) return;
        
        if (this.state.currentRound >= this.state.maxRounds) {
            this.endGame();
            return;
        }

        this.state.currentRound++;
        
        // Refill pool if empty to allow rounds > characters
        if (this.state.availablePool.length === 0) {
            this.state.availablePool = [...this.state.fullPool].sort(() => Math.random() - 0.5);
        }

        // Pick correct answer
        const correctChar = this.state.availablePool.pop();
        
        // Pick 2 wrong options
        const wrongOptions = this.state.fullPool
            .filter(c => c.id !== correctChar.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 2);
            
        const options = [correctChar, ...wrongOptions].sort(() => Math.random() - 0.5);
        
        this.state.currentQuestion = {
            correct: correctChar,
            options: options
        };

        this.ui.renderGameRound(this.state);
    }

    handleAnswer(selectedId) {
        if (!this.state.isActive || !this.state.currentQuestion) return;
        
        const isCorrect = selectedId === this.state.currentQuestion.correct.id;
        const selectedChar = this.state.currentQuestion.options.find(o => o.id === selectedId);
        
        if (isCorrect) {
            this.state.score += 100 + (this.state.streak * 10);
            this.state.streak++;
            if (this.state.streak > this.state.maxStreak) {
                this.state.maxStreak = this.state.streak;
            }
        } else {
            this.state.streak = 0;
            const existingMistake = this.state.mistakes.find(m => m.correctId === this.state.currentQuestion.correct.id);
            if (!existingMistake) {
                this.state.mistakes.push({
                    correctId: this.state.currentQuestion.correct.id,
                    image: this.state.currentQuestion.correct.photoUrl,
                    correctName: this.state.currentQuestion.correct.name,
                    wrongName: selectedChar ? selectedChar.name : "Unknown"
                });
            }
        }

        this.ui.updateGameStats(this.state);
        this.ui.showAnswerFeedback(selectedId, this.state.currentQuestion.correct.id);
        
        setTimeout(() => {
            if (isCorrect) {
                this.ui.playVideoReward(this.state.currentQuestion.correct.name, () => {
                    this.nextRound();
                });
            } else {
                this.nextRound();
            }
        }, 1200);
    }

    endGame() {
        this.state.isActive = false;
        const result = this.store.updateHighScore(this.state.category, this.state.score, this.state.maxStreak);
        this.ui.renderResults(this.state, result);
        this.ui.navigate('results');
        
        if (result.isNewHigh && this.state.score > 0) {
            Confetti.fire();
        }
    }
}

// --- App / UI Manager ---
class App {
    constructor() {
        this.store = new DataStore();
        this.game = new GameEngine(this.store, this);
        this.currentScreen = 'home';
        this.theme = localStorage.getItem('charquiz_theme') || 'dark';
        this.galleryFilter = 'All';
        this.labelsFilter = 'All';
        this.gallerySearch = '';
        
        this.initDOM();
        this.bindEvents();
        this.applyTheme(this.theme);
        Confetti.init();
        
        // Setup PIN Authentication
        this.initAuth();
        
        // Smart Adder (initialized after DOM is ready)
        this.smartAdder = new SmartAdder(this);

        // Wire Smart Adding button
        const openSmartAddBtn = document.getElementById('openSmartAddBtn');
        if (openSmartAddBtn) {
            openSmartAddBtn.addEventListener('click', () => this.smartAdder.open());
        }

        this.initData();
    }

    initAuth() {
        const PIN_CODE = "711424";
        const pinModal = document.getElementById('pinModal');
        const isAuth = localStorage.getItem('charquiz_authenticated');
        const authTime = parseInt(localStorage.getItem('charquiz_auth_time') || '0', 10);
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        
        if (isAuth !== 'true' || (Date.now() - authTime) > threeDaysMs) {
            pinModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            setTimeout(() => document.getElementById('pinInput').focus(), 100);
        }
        
        document.getElementById('pinForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('pinInput').value;
            if (input === PIN_CODE) {
                localStorage.setItem('charquiz_authenticated', 'true');
                localStorage.setItem('charquiz_auth_time', Date.now().toString());
                pinModal.classList.add('hidden');
                document.getElementById('pinError').classList.add('hidden');
                document.body.style.overflow = '';
            } else {
                document.getElementById('pinError').classList.remove('hidden');
                document.getElementById('pinInput').value = '';
                document.getElementById('pinInput').focus();
            }
        });
    }

    initData() {
        this.store.loadCharacters();
        this.renderHome();
    }

    initDOM() {
        // Screens
        this.screens = {
            home: document.getElementById('screen-home'),
            gallery: document.getElementById('screen-gallery'),
            config: document.getElementById('screen-config'),
            game: document.getElementById('screen-game'),
            results: document.getElementById('screen-results')
        };
        
        // Modals
        this.modals = {
            manager: document.getElementById('managerModal'),
            edit: document.getElementById('editModal'),
            image: document.getElementById('imageModal'),
            random: document.getElementById('randomModal'),
            labelsManager: document.getElementById('labelsManagerModal'),
            rewardVideo: document.getElementById('rewardVideoModal')
        };
        
        this.toastContainer = document.getElementById('toastContainer');
    }

    bindEvents() {
        // Mobile Menu Toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const navLinks = document.getElementById('navLinks');
        if (mobileMenuBtn && navLinks) {
            mobileMenuBtn.addEventListener('click', () => {
                navLinks.classList.toggle('active');
            });
            
            navLinks.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                });
            });
        }

        // Global Navigation
        document.querySelectorAll('.nav-btn, .logo').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget.dataset.target;
                if (target) this.navigate(target);
            });
        });

        // Manage Labels Modal
        const manageLabelsBtn = document.getElementById('manageLabelsBtn');
        if (manageLabelsBtn) manageLabelsBtn.addEventListener('click', () => {
            this.renderLabelsManager();
            this.openModal('labelsManager');
        });
        document.getElementById('closeLabelsManagerModal').addEventListener('click', () => this.closeModal('labelsManager'));
        document.getElementById('labelsManagerModalBackdrop').addEventListener('click', () => this.closeModal('labelsManager'));
        
        document.getElementById('addLabelForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('newLabelInput');
            if (this.store.addLabel(input.value)) {
                this.showToast('Label added');
                input.value = '';
                this.renderLabelsManager();
                // refresh gallery labels if open
                if (!this.screens.gallery.classList.contains('hidden')) this.renderGallery();
            } else {
                this.showToast('Invalid or duplicate label', 'error');
            }
        });

        const syncBtn = document.getElementById('syncBtn');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => {
                this.store.loadCharacters();
                this.renderHome();
                this.showToast('Data reloaded');
            });
        }

        // Theme Toggle
        document.getElementById('themeToggleBtn').addEventListener('click', () => {
            this.theme = this.theme === 'dark' ? 'light' : 'dark';
            this.applyTheme(this.theme);
            localStorage.setItem('charquiz_theme', this.theme);
        });

        // Global Image Modal
        document.body.addEventListener('click', (e) => {
            if (e.target.tagName === 'IMG' && 
                !e.target.closest('#managerCharacterList') && 
                !e.target.closest('.mistake-item') &&
                e.target.id !== 'randomModalImage' &&
                e.target.id !== 'globalModalImage') {
                // Ensure it has a src
                if (e.target.src) this.openImageModal(e.target.src);
            }
        });
        document.getElementById('closeImageModal').addEventListener('click', () => this.closeModal('image'));
        document.getElementById('imageModalBackdrop').addEventListener('click', () => this.closeModal('image'));
        document.getElementById('globalModalImage').addEventListener('click', () => this.closeModal('image'));

        // Random Character Modal
        const handleRandomRoll = () => {
            const allChars = this.store.getCharacters();
            if (allChars.length === 0) {
                this.showToast('No characters available. Add some first!', 'error');
                return;
            }
            const randomChar = allChars[Math.floor(Math.random() * allChars.length)];
            document.getElementById('randomModalImage').src = getProxiedUrl(randomChar.photoUrl);
            document.getElementById('randomModalName').textContent = randomChar.name;
            document.getElementById('randomModalCategory').textContent = randomChar.category;
            
            const searchBtn = document.getElementById('randomModalSearchBtn');
            if (searchBtn) {
                searchBtn.href = `https://www.google.com/search?tbm=vid&q=${encodeURIComponent(randomChar.name + ' porn video')}`;
                searchBtn.classList.remove('hidden');
            }
            
            this.openModal('random');
        };

        const randomBtn = document.getElementById('randomCharBtn');
        if (randomBtn) randomBtn.addEventListener('click', handleRandomRoll);
        
        document.getElementById('randomCharRollBtn').addEventListener('click', handleRandomRoll);
        document.getElementById('closeRandomModal').addEventListener('click', () => this.closeModal('random'));
        document.getElementById('randomModalBackdrop').addEventListener('click', () => this.closeModal('random'));

        // Manager Modal
        document.getElementById('openManagerBtn').addEventListener('click', () => {
            const lastCategory = localStorage.getItem('charquiz_last_category');
            if (lastCategory) {
                const addCategorySelect = document.getElementById('addCategory');
                if ([...addCategorySelect.options].some(opt => opt.value === lastCategory)) {
                    addCategorySelect.value = lastCategory;
                }
            }
            this.renderLabelSelector('addLabelsContainer', []);
            this.openModal('manager');
        });
        document.getElementById('closeManagerModal').addEventListener('click', () => this.closeModal('manager'));
        document.getElementById('managerModalBackdrop').addEventListener('click', () => this.closeModal('manager'));

        // Edit Modal
        document.getElementById('closeEditModal').addEventListener('click', () => this.closeModal('edit'));
        document.getElementById('editModalBackdrop').addEventListener('click', () => this.closeModal('edit'));

        // Image Preview Buttons
        const setupPreviewBtn = (inputId, btnId) => {
            const input = document.getElementById(inputId);
            const btn = document.getElementById(btnId);
            if (input && btn) {
                const updateLink = () => {
                    if (input.value.trim()) {
                        btn.href = input.value.trim();
                    } else {
                        btn.href = '#';
                    }
                };
                input.addEventListener('input', updateLink);
                btn.addEventListener('click', (e) => {
                    if (!input.value.trim()) {
                        e.preventDefault();
                        this.showToast('Please enter an image URL first', 'error');
                    }
                });
            }
        };
        setupPreviewBtn('addUrl', 'addUrlPreviewBtn');
        setupPreviewBtn('editUrl', 'editUrlPreviewBtn');

        // CRUD Actions
        document.getElementById('addCharacterForm').addEventListener('submit', (e) => this.handleAddCharacter(e));
        document.getElementById('editCharacterForm').addEventListener('submit', (e) => this.handleEditCharacter(e));
        document.getElementById('exportDataBtn').addEventListener('click', () => this.store.exportData());
        document.getElementById('importDataInput').addEventListener('change', (e) => this.handleImportData(e));
        document.getElementById('clearAllDataBtn').addEventListener('click', () => this.handleClearAllData());

        // Home Screen
        document.getElementById('homeCategoryGrid').addEventListener('click', (e) => {
            const card = e.target.closest('.category-card');
            if (card) {
                const category = card.dataset.category;
                this.openGameConfig(category);
            }
        });

        // Gallery Filters
        document.getElementById('gallerySearch').addEventListener('input', (e) => {
            this.gallerySearch = e.target.value.toLowerCase();
            this.renderGallery();
        });
        document.getElementById('galleryFilters').addEventListener('click', (e) => {
            if (e.target.classList.contains('pill')) {
                document.querySelectorAll('#galleryFilters .pill').forEach(p => p.classList.remove('active'));
                e.target.classList.add('active');
                this.galleryFilter = e.target.dataset.filter;
                this.renderGallery();
            }
        });
        document.getElementById('galleryLabelFilters').addEventListener('click', (e) => {
            if (e.target.classList.contains('pill')) {
                document.querySelectorAll('#galleryLabelFilters .pill').forEach(p => p.classList.remove('active'));
                e.target.classList.add('active');
                this.labelsFilter = e.target.dataset.label;
                this.renderGallery();
            }
        });

        // Game Config
        document.getElementById('startGameBtn').addEventListener('click', () => {
            const roundsStr = document.querySelector('input[name="rounds"]:checked').value;
            const cat = document.getElementById('configCategoryTitle').dataset.category;
            this.game.start(cat, roundsStr);
        });
        document.getElementById('backFromConfigBtn').addEventListener('click', () => {
            this.navigate('home');
        });

        // Gameplay
        document.getElementById('gameOptions').addEventListener('click', (e) => {
            const btn = e.target.closest('.opt-btn');
            if (btn && !btn.disabled) {
                // Disable all to prevent double clicks
                document.querySelectorAll('.opt-btn').forEach(b => b.disabled = true);
                this.game.handleAnswer(btn.dataset.id);
            }
        });
        document.getElementById('endGameBtn').addEventListener('click', () => {
             // End the game instantly and go to results
             if (this.game.state.isActive) {
                 this.game.endGame();
             }
        });

        document.getElementById('playAgainBtn').addEventListener('click', () => this.navigate('home'));
    }

    applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('theme-dark');
            document.getElementById('themeToggleBtn').textContent = '☀️';
        } else {
            document.body.classList.remove('theme-dark');
            document.getElementById('themeToggleBtn').textContent = '🌙';
        }
    }

    navigate(screenId) {
        Object.values(this.screens).forEach(screen => {
            if (screen) screen.classList.add('hidden');
        });
        this.screens[screenId].classList.remove('hidden');

        if (screenId === 'home') this.renderHome();
        if (screenId === 'gallery') this.renderGallery();
    }

    openModal(modalId) {
        this.modals[modalId].classList.remove('hidden');
    }

    closeModal(modalId) {
        this.modals[modalId].classList.add('hidden');
    }

    openImageModal(src, name = null) {
        document.getElementById('globalModalImage').src = src;
        const searchBtn = document.getElementById('globalModalSearchBtn');
        if (searchBtn) {
            if (name) {
                searchBtn.href = `https://www.google.com/search?tbm=vid&q=${encodeURIComponent(name + ' porn video')}`;
                searchBtn.classList.remove('hidden');
            } else {
                searchBtn.classList.add('hidden');
            }
        }
        this.openModal('image');
    }

    playVideoReward(performerName, onComplete) {
        onComplete();
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${type === 'success' ? '✅' : '❌'}</span>
            <span>${message}</span>
        `;
        this.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // --- Rendering Methods ---

    renderHome() {
        const grid = document.getElementById('homeCategoryGrid');
        grid.innerHTML = '';
        
        const categories = [...CATEGORIES, 'Mix'];
        
        categories.forEach(cat => {
            const chars = this.store.getCharacters(cat);
            let bgUrl = '';
            if (chars.length > 0) {
                // Pick random bg and proxy it
                bgUrl = getProxiedUrl(chars[Math.floor(Math.random() * chars.length)].photoUrl);
            } else {
                bgUrl = 'https://via.placeholder.com/300x400/222/555?text=' + cat;
            }

            const card = document.createElement('div');
            card.className = 'category-card';
            card.dataset.category = cat;
            card.innerHTML = `
                <div class="card-bg" style="background-image: url('${bgUrl}')"></div>
                <div class="card-overlay">
                    <h3>${cat}</h3>
                    <span class="count">${chars.length} Characters</span>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    renderGallery() {
        const grid = document.getElementById('galleryGrid');
        const filterContainer = document.getElementById('galleryLabelFilters');
        grid.innerHTML = '';
        
        const allChars = this.store.getCharacters();
        // Collect all unique labels
        const uniqueLabels = new Set();
        allChars.forEach(c => {
            if (Array.isArray(c.labels)) {
                c.labels.forEach(l => uniqueLabels.add(l));
            }
        });
        
        // Render Label Filter Pills
        const sortedLabels = Array.from(uniqueLabels).sort();
        let labelsHtml = `<button class="pill ${this.labelsFilter === 'All' ? 'active' : ''}" data-label="All">Any Label</button>`;
        sortedLabels.forEach(label => {
            labelsHtml += `<button class="pill ${this.labelsFilter === label ? 'active' : ''}" data-label="${label}">${label}</button>`;
        });
        filterContainer.innerHTML = labelsHtml;
        // Hide container if there are no labels
        filterContainer.style.display = sortedLabels.length > 0 ? 'flex' : 'none';

        // Filter Characters
        const chars = this.store.getCharacters(this.galleryFilter).filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(this.gallerySearch);
            const matchesLabel = this.labelsFilter === 'All' || (Array.isArray(c.labels) && c.labels.includes(this.labelsFilter));
            return matchesSearch && matchesLabel;
        });

        if (chars.length === 0) {
            grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted)">No characters found.</p>`;
            return;
        }

        chars.forEach(c => {
            const item = document.createElement('div');
            item.className = 'char-item';
            item.innerHTML = `
                <img src="${getProxiedUrl(c.photoUrl)}" loading="lazy" alt="${c.name}">
                <div class="char-item-actions">
                    <button class="char-action-btn edit" onclick="app.openEditModal('${c.id}', event)" title="Edit">✏️</button>
                    <button class="char-action-btn delete" onclick="app.handleDeleteCharacter('${c.id}', event)" title="Delete">🗑️</button>
                    <a href="https://www.google.com/search?tbm=vid&q=${encodeURIComponent(c.name + ' porn video')}" target="_blank" class="char-action-btn search" title="Search Video" onclick="event.stopPropagation()" style="text-decoration:none; display:flex; align-items:center; justify-content:center; background: rgba(59, 130, 246, 0.8);">🎬</a>
                </div>
                <div class="char-item-info">
                    <strong>${c.name}</strong>
                    <span>${c.category}</span>
                    ${Array.isArray(c.labels) && c.labels.length > 0 ? 
                        `<div class="char-item-labels">${c.labels.map(l => `<span class="char-label">${l}</span>`).join('')}</div>` : ''}
                </div>
            `;
            grid.appendChild(item);
        });
    }

    openEditModal(id, e) {
        if (e) e.stopPropagation();
        const char = this.store.getCharacters().find(c => c.id === id);
        if (!char) return;

        document.getElementById('editId').value = char.id;
        document.getElementById('editName').value = char.name;
        document.getElementById('editCategory').value = char.category;
        document.getElementById('editUrl').value = char.photoUrl;

        this.renderLabelSelector('editLabelsContainer', char.labels || []);

        this.openModal('edit');
    }

    openGameConfig(category) {
        const chars = this.store.getCharacters(category);
        if (chars.length < 3) {
            this.showToast(`Need at least 3 characters in ${category} to play. Currently have ${chars.length}.`, 'error');
            return;
        }
        
        const title = document.getElementById('configCategoryTitle');
        title.textContent = `${category} Mode`;
        title.dataset.category = category;
        
        // Ensure all round options are enabled
        document.querySelectorAll('input[name="rounds"]').forEach(input => {
            input.disabled = false;
            input.parentElement.style.opacity = '1';
            input.parentElement.style.pointerEvents = 'auto';
        });
        
        // Auto select a logical default option
        const tenOption = document.querySelector('input[name="rounds"][value="10"]');
        if (tenOption) {
            tenOption.checked = true;
        } else {
            const firstValid = document.querySelector('input[name="rounds"]');
            if (firstValid) firstValid.checked = true;
        }

        this.navigate('config');
    }

    renderGameRound(state) {
        document.getElementById('currentRound').textContent = state.maxRounds === Infinity ? 
            state.currentRound : `${state.currentRound} / ${state.maxRounds}`;
        document.getElementById('currentStreak').textContent = state.streak;
        
        let progress = 0;
        if (state.maxRounds !== Infinity) {
            progress = ((state.currentRound - 1) / state.maxRounds) * 100;
        }
        document.getElementById('gameProgressFill').style.width = `${progress}%`;
        
        const img = document.getElementById('gameImage');
        img.src = getProxiedUrl(state.currentQuestion.correct.photoUrl);
        
        const searchBtn = document.getElementById('gameSearchVideoBtn');
        if (searchBtn) {
            searchBtn.href = `https://www.google.com/search?tbm=vid&q=${encodeURIComponent(state.currentQuestion.correct.name + ' porn video')}`;
            searchBtn.classList.remove('hidden');
        }
        
        const optsContainer = document.getElementById('gameOptions');
        optsContainer.innerHTML = '';
        
        state.currentQuestion.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'opt-btn';
            btn.dataset.id = opt.id;
            btn.textContent = opt.name;
            optsContainer.appendChild(btn);
        });
    }

    updateGameStats(state) {
        document.getElementById('currentStreak').textContent = state.streak;
        
        let progress = 0;
        if (state.maxRounds !== Infinity) {
            progress = (state.currentRound / state.maxRounds) * 100;
        }
        document.getElementById('gameProgressFill').style.width = `${progress}%`;
    }

    showAnswerFeedback(selectedId, correctId) {
        document.querySelectorAll('.opt-btn').forEach(btn => {
            if (btn.dataset.id === correctId) {
                btn.classList.add('correct');
            } else if (btn.dataset.id === selectedId) {
                btn.classList.add('incorrect');
            }
        });
    }

    renderResults(state, resultInfo) {
        document.getElementById('finalScore').textContent = state.score;
        document.getElementById('maxStreak').textContent = state.maxStreak;
        document.getElementById('highScore').textContent = resultInfo.record.score;
        
        const label = resultInfo.isNewHigh ? '🏆 New' : 'All-Time';
        document.querySelector('.metric.highlight span').innerHTML = `${label} High Score`;

        const mistakesList = document.getElementById('mistakesList');
        mistakesList.innerHTML = '';
        
        if (state.mistakes.length === 0) {
            mistakesList.innerHTML = '<p style="color:var(--success)">Perfect game! No mistakes to review.</p>';
        } else {
            state.mistakes.forEach(m => {
                const item = document.createElement('div');
                item.className = 'mistake-item';
                item.innerHTML = `
                    <div class="mistake-img-container" style="position:relative;">
                        <a href="https://www.google.com/search?tbm=vid&q=${encodeURIComponent(m.correctName + ' porn video')}" target="_blank" class="char-action-btn" title="Search Video" style="position:absolute; top:0.5rem; right:0.5rem; text-decoration:none; display:flex; align-items:center; justify-content:center; background: rgba(59, 130, 246, 0.8); z-index:10;">🎬</a>
                        <img src="${getProxiedUrl(m.image)}" alt="Character">
                    </div>
                    <div class="mistake-info">
                        <span class="wrong">${m.wrongName}</span>
                        <span class="right">${m.correctName}</span>
                    </div>
                `;
                mistakesList.appendChild(item);
            });
        }
    }

    renderLabelSelector(containerId, activeLabels) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        const allLabels = this.store.customLabels;
        
        if (allLabels.length === 0) {
            container.innerHTML = '<span style="font-size: 0.85rem; color: var(--text-muted);">No labels created. Manage them in Gallery.</span>';
            return;
        }

        allLabels.forEach(label => {
            const isChecked = activeLabels.includes(label);
            const labelEl = document.createElement('label');
            labelEl.className = 'label-cb-pill';
            labelEl.innerHTML = `
                <input type="checkbox" value="${label}" ${isChecked ? 'checked' : ''} style="display:none;">
                <span>${label}</span>
            `;
            container.appendChild(labelEl);
        });
    }

    renderLabelsManager() {
        const list = document.getElementById('labelsManagerList');
        if (!list) return;
        
        list.innerHTML = '';
        const allLabels = this.store.customLabels;
        
        if (allLabels.length === 0) {
            list.innerHTML = '<span style="color: var(--text-muted); text-align: center; display: block; padding: 1rem;">No labels yet.</span>';
            return;
        }

        allLabels.forEach(label => {
            const item = document.createElement('div');
            item.className = 'label-manager-item';
            item.innerHTML = `
                <span>${label}</span>
                <button class="char-action-btn delete" data-label="${label}" title="Delete Label" style="width: 25px; height: 25px; font-size: 0.8rem;">&times;</button>
            `;
            list.appendChild(item);
        });

        // Bind delete buttons
        list.querySelectorAll('.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const labelToDelete = e.target.dataset.label;
                if (confirm(`Delete label "${labelToDelete}"? This will not remove it from characters who already have it, but you won't be able to select it anymore.`)) {
                    this.store.deleteLabel(labelToDelete);
                    this.renderLabelsManager();
                    if (!this.screens.gallery.classList.contains('hidden')) this.renderGallery();
                }
            });
        });
    }

    // --- Action Handlers ---

    handleAddCharacter(e) {
        e.preventDefault();
        const name = document.getElementById('addName').value;
        const category = document.getElementById('addCategory').value;
        const url = document.getElementById('addUrl').value;
        
        const labels = Array.from(document.querySelectorAll('#addLabelsContainer input[type="checkbox"]:checked')).map(cb => cb.value);

        if (category) localStorage.setItem('charquiz_last_category', category);
        
        this.store.addCharacter(name, category, url, labels);
        this.renderGallery();
        this.renderHome();
        this.closeModal('manager');
        this.showToast('Character saved!');
        e.target.reset();
        document.getElementById('addUrlPreviewBtn').href = '#';
    }

    handleEditCharacter(e) {
        e.preventDefault();
        const id = document.getElementById('editId').value;
        const name = document.getElementById('editName').value;
        const category = document.getElementById('editCategory').value;
        const url = document.getElementById('editUrl').value;
        
        const labels = Array.from(document.querySelectorAll('#editLabelsContainer input[type="checkbox"]:checked')).map(cb => cb.value);

        if (category) localStorage.setItem('charquiz_last_category', category);
        
        this.store.updateCharacter(id, name, category, url, labels);
        this.renderGallery();
        this.renderHome();
        this.closeModal('edit');
        this.showToast('Character updated!');
        e.target.reset();
        document.getElementById('editUrlPreviewBtn').href = '#';
    }

    handleDeleteCharacter(id, e) {
        if (e) e.stopPropagation();
        if (confirm('Are you sure you want to permanently delete this character?')) {
            this.store.deleteCharacter(id);
            this.renderGallery();
            this.renderHome();
            this.showToast('Character deleted.');
        }
    }

    handleImportData(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        this.showToast('Importing data...', 'success');
        
        this.store.importData(file, (count) => {
            this.renderGallery();
            this.renderHome();
            this.showToast(`Imported ${count} new characters!`);
            e.target.value = '';
        }, (err) => {
            this.showToast(`Import failed: ${err.message}`, 'error');
            e.target.value = '';
        });
    }

    handleClearAllData() {
        if (confirm('Are you sure you want to permanently clear all performers data? This cannot be undone.')) {
            this.store.clearAll();
            this.renderGallery();
            this.renderHome();
            this.showToast('All performer data has been cleared.');
            const managerModal = document.getElementById('managerModal');
            if (managerModal) managerModal.classList.add('hidden');
        }
    }

}

// =================== SMART ADDER ===================
class SmartAdder {
    constructor(app) {
        this.app = app;
        this.STORAGE_KEY = 'charquiz_smartadd_state';

        // Runtime state
        this.state = {
            phase: 'cats',         // 'cats' | 'browsing'
            category: null,        // pornpics category: 'female' | 'shemale' | 'gay'
            gameCat: 'Slut',       // game category: 'Slut' | 'Shemale' | 'Twink'
            queue: [],             // array of {name, slug, avatarUrl} pending review
            currentPage: 1,
            hasMore: true,
            addedCount: 0,         // total added this session
            current: null,         // current performer being reviewed
            photos: [],            // photo URLs for current performer
            photoIdx: 0,           // current photo index
        };

        this.initDOM();
        this.bindEvents();
    }

    initDOM() {
        this.modal        = document.getElementById('smartAddModal');
        this.phase1       = document.getElementById('smartAddPhase1');
        this.phase2       = document.getElementById('smartAddPhase2');
        this.loadingEl    = document.getElementById('smartAddLoading');
        this.loadingText  = document.getElementById('smartAddLoadingText');
        this.performerEl  = document.getElementById('smartAddPerformer');
        this.emptyEl      = document.getElementById('smartAddEmpty');
        this.photoEl      = document.getElementById('smartAddPhoto');
        this.counterEl    = document.getElementById('smartPhotoCounter');
        this.photoOverlay = document.getElementById('smartPhotoLoadingOverlay');
        this.nameInput    = document.getElementById('smartPerformerName');
        this.catSelect    = document.getElementById('smartPerformerCategory');
        this.labelPills   = document.getElementById('smartAddLabelPills');
        this.statsEl      = document.getElementById('smartAddStats');
        this.queueInfo    = document.getElementById('smartAddQueueInfo');
        this.catLabel     = document.getElementById('smartAddCatLabel');
        this.resumeInfo   = document.getElementById('smartAddResumeInfo');
        this.subtitle     = document.getElementById('smartAddSubtitle');
    }

    bindEvents() {
        // Category buttons
        document.querySelectorAll('.smart-cat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.startCategory(btn.dataset.cat, btn.dataset.gameCat);
            });
        });

        const searchForm = document.getElementById('smartSearchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('smartSearchInput').value;
                const cat = document.getElementById('smartSearchCategory').value;
                this.searchPerformer(name, cat);
            });
        }

        // Resume saved session
        document.getElementById('smartAddResumeBtn').addEventListener('click', () => {
            this.resumeSession();
        });

        // Back to categories
        document.getElementById('smartAddBackToCats').addEventListener('click', () => {
            this.saveSession();
            this.showPhase1();
        });

        // Photo navigation
        document.getElementById('smartPhotoPrev').addEventListener('click', () => this.prevPhoto());
        document.getElementById('smartPhotoNext').addEventListener('click', () => this.nextPhoto());

        // Keyboard navigation when modal is open
        document.addEventListener('keydown', (e) => {
            if (this.modal.classList.contains('hidden')) return;
            if (this.state.phase !== 'browsing') return;
            if (document.activeElement === this.nameInput) return;

            if (e.key === 'ArrowLeft')  this.prevPhoto();
            if (e.key === 'ArrowRight') this.nextPhoto();
            if (e.key === 'Enter') {
                document.getElementById('smartSaveAddBtn').click();
            }
            if (e.key === 's' || e.key === 'S') {
                document.getElementById('smartSkipBtn').click();
            }
        });

        // Add & Next
        document.getElementById('smartSaveAddBtn').addEventListener('click', () => this.addCurrentPerformer());

        // Skip
        document.getElementById('smartSkipBtn').addEventListener('click', () => this.skipCurrentPerformer());

        // Load more performers
        document.getElementById('smartLoadMoreBtn').addEventListener('click', () => this.loadMorePerformers());
        document.getElementById('smartRetryBtn').addEventListener('click', () => this.retryFetch());

        // Close modal
        document.getElementById('closeSmartAddModal').addEventListener('click', () => this.closeModal());
        document.getElementById('smartAddModalBackdrop').addEventListener('click', () => this.closeModal());

        // Click photo to view full-size
        this.photoEl.addEventListener('click', () => {
            if (this.photoEl.src) {
                this.app.openImageModal(this.photoEl.src, this.state.current?.name);
            }
        });
    }

    open() {
        this.modal.classList.remove('hidden');
        this.checkSavedSession();
        this.showPhase1();
    }

    closeModal() {
        this.saveSession();
        this.modal.classList.add('hidden');
    }

    // ---- Session Persistence ----
    saveSession() {
        if (!this.state.category) return;
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
                category: this.state.category,
                gameCat: this.state.gameCat,
                queue: this.state.queue,
                currentPage: this.state.currentPage,
                hasMore: this.state.hasMore,
                addedCount: this.state.addedCount
            }));
        } catch (e) {}
    }

    loadSession() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    }

    clearSession() {
        localStorage.removeItem(this.STORAGE_KEY);
    }

    checkSavedSession() {
        const saved = this.loadSession();
        if (saved && saved.queue && saved.queue.length > 0) {
            this.resumeInfo.classList.remove('hidden');
        } else {
            this.resumeInfo.classList.add('hidden');
        }
    }

    resumeSession() {
        const saved = this.loadSession();
        if (!saved) return;
        this.state.category    = saved.category;
        this.state.gameCat     = saved.gameCat;
        this.state.currentPage = saved.currentPage || 1;
        this.state.hasMore     = saved.hasMore !== false;
        this.state.addedCount  = saved.addedCount || 0;
        this.state.phase       = 'browsing';

        // --- Bug #9 Fix: re-filter the saved queue against the current store ---
        // Characters may have been added manually since the session was saved.
        const existingNames = new Set(
            this.app.store.getCharacters()
                .filter(c => c && c.name)
                .map(c => c.name.toLowerCase().trim())
        );
        this.state.queue = (saved.queue || []).filter(
            p => p && p.name && !existingNames.has(p.name.toLowerCase().trim())
        );

        const CAT_LABELS = { female: 'Female Pornstars', shemale: 'Shemale Stars', gay: 'Gay/Twink Stars' };
        this.catLabel.textContent = CAT_LABELS[this.state.category] || 'Performers';
        this.subtitle.textContent = `Resuming session • ${this.state.addedCount} added`;

        // --- Bug #1 Fix: if queue already has items, skip the loading screen ---
        this.state.phase = 'browsing';
        this.phase1.classList.add('hidden');
        this.phase2.classList.remove('hidden');
        if (this.state.queue.length === 0) {
            this.showLoading('Loading more performers...');
        }
        this.loadNextPerformer();
    }

    // ---- Phase Management ----
    showPhase1() {
        this.state.phase = 'cats';
        this.phase1.classList.remove('hidden');
        this.phase2.classList.add('hidden');
        this.checkSavedSession();
    }

    showPhase2() {
        this.state.phase = 'browsing';
        this.phase1.classList.add('hidden');
        this.phase2.classList.remove('hidden');
        this.showLoading('Loading performers...');
    }

    // --- Bug #4 Fix: centralized visibility helpers use only class toggling ---
    // All show*/hide* methods exclusively use classList to avoid style.display conflicts.

    showLoading(msg = 'Loading...') {
        this.loadingText.textContent = msg;
        this.loadingEl.classList.remove('hidden');
        this.performerEl.classList.add('hidden');
        this.emptyEl.classList.add('hidden');
    }

    showPerformer() {
        this.loadingEl.classList.add('hidden');
        this.emptyEl.classList.add('hidden');
        this.performerEl.classList.remove('hidden');
    }

    updateStats() {
        this.statsEl.textContent = `✅ ${this.state.addedCount} added`;
        this.queueInfo.textContent = `${this.state.queue.length} in queue`;
    }

    // Show empty panel in two modes: 'done' (load more) or 'error' (retry)
    showEmpty(mode = 'done') {
        this.loadingEl.classList.add('hidden');
        this.performerEl.classList.add('hidden');
        this.emptyEl.classList.remove('hidden');

        const msg = document.getElementById('smartAddEmptyMsg');
        const loadMoreBtn = document.getElementById('smartLoadMoreBtn');
        const retryBtn = document.getElementById('smartRetryBtn');

        if (mode === 'error') {
            msg.textContent = 'Failed to load the next page. Check your connection and try again.';
            loadMoreBtn.classList.add('hidden');
            retryBtn.classList.remove('hidden');
        } else {
            msg.textContent = 'All performers on this page have been reviewed!';
            loadMoreBtn.classList.remove('hidden');
            loadMoreBtn.disabled = false;
            loadMoreBtn.title = '';
            retryBtn.classList.add('hidden');
        }
    }

    // ---- Category Start ----
    async startCategory(pornpicsCat, gameCat) {
        this.clearSession();
        this.state.mode        = 'bulk';
        this.state.category    = pornpicsCat;
        this.state.gameCat     = gameCat;
        this.state.queue       = [];
        this.state.currentPage = 1;
        this.state.hasMore     = true;
        this.state.addedCount  = 0;
        this.state.current     = null;
        this.state.photos      = [];
        this.state.photoIdx    = 0;

        const CAT_LABELS = { female: 'Female Pornstars', shemale: 'Shemale Stars', gay: 'Gay/Twink Stars' };
        this.catLabel.textContent = CAT_LABELS[pornpicsCat] || 'Performers';
        this.subtitle.textContent = `Browsing ${CAT_LABELS[pornpicsCat]}`;

        this.showPhase2();
        await this.fetchPerformers();
        if (this.state.fetchFailed) {
            this.showEmpty('error');
            return;
        }
        this.loadNextPerformer();
    }

    // ---- Search Single Performer ----
    async searchPerformer(name, gameCat) {
        this.clearSession();
        this.state.mode        = 'single';
        this.state.category    = 'search';
        this.state.gameCat     = gameCat;
        this.state.queue       = [];
        this.state.currentPage = 1;
        this.state.hasMore     = false;
        this.state.addedCount  = 0;
        this.state.current     = null;
        this.state.photos      = [];
        this.state.photoIdx    = 0;
        
        const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const performer = {
            name: name.trim(),
            slug: slug,
            avatarUrl: ''
        };
        
        this.state.queue.push(performer);
        
        this.catLabel.textContent = 'Search Result';
        this.subtitle.textContent = `Searching for ${name}`;
        
        this.showPhase2();
        this.loadNextPerformer();
    }

    // ---- Fetch Performers from API ----
    async fetchPerformers() {
        this.showLoading(`Loading page ${this.state.currentPage}...`);
        try {
            const res = await fetch(`/api/browse-stars?category=${this.state.category}&page=${this.state.currentPage}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            if (data.performers && data.performers.length > 0) {
                // Filter out already-added names
                const existingNames = new Set(
                    this.app.store.getCharacters()
                        .filter(c => c && c.name)
                        .map(c => c.name.toLowerCase().trim())
                );
                const fresh = data.performers.filter(p =>
                    p && p.name && !existingNames.has(p.name.toLowerCase().trim())
                );
                this.state.queue.push(...fresh);
            }

            this.state.hasMore = !!data.hasMore;
            this.state.currentPage = data.nextPage || this.state.currentPage + 1;
            this.state.fetchFailed = false;

            this.updateStats();
        } catch (err) {
            this.state.fetchFailed = true;
            this.app.showToast(`Failed to load performers: ${err.message}`, 'error');
        }
    }

    // ---- Load Next Performer ----
    async loadNextPerformer(isAutoSkip = false) {
        if (!isAutoSkip || typeof this.state.pagesFetched === 'undefined') {
            this.state.pagesFetched = 0;
        }
        while (true) {
            if (this.state.queue.length === 0) {
                if (this.state.mode === 'single') {
                    this.closeModal();
                    return;
                }
                
                if (this.state.hasMore && this.state.pagesFetched < 3) {
                    this.state.pagesFetched++;
                    await this.fetchPerformers();
                    if (this.state.fetchFailed) {
                        this.showEmpty('error');
                        return;
                    }
                    if (this.state.queue.length === 0) {
                        this.showEmpty('done');
                        return;
                    }
                } else {
                    this.showEmpty('done');
                    return;
                }
            }

            this.state.current  = this.state.queue.shift();
            this.state.photos   = [];
            this.state.photoIdx = 0;
            this.state.currentPhotoUrl = null;

            // --- Auto-skip: check if this performer is already in the store ---
            if (this._isAlreadyAdded(this.state.current.name)) {
                console.log(`Auto-skipped: ${this.state.current.name} (already exists)`);
                continue;
            }

            break;
        }

        this.updateStats();
        this.saveSession();
        this.renderPerformer();
        this.fetchPerformerPhotos(this.state.current.slug);
    }

    // Helper: case-insensitive name check against the store
    _isAlreadyAdded(name) {
        if (!name) return false;
        const normalized = name.trim().toLowerCase();
        return this.app.store.getCharacters().some(c => {
            if (!c || !c.name) return false;
            return c.name.toLowerCase().trim() === normalized;
        });
    }

    // ---- Render Current Performer (with avatar immediately) ----
    renderPerformer() {
        const p = this.state.current;
        this.nameInput.value = p.name;
        this.catSelect.value = this.state.gameCat;

        // Render labels
        this.renderLabelPills([]);

        // Show avatar immediately while photos load
        const initialPhoto = p.avatarUrl || '';
        this.state.photos = initialPhoto ? [initialPhoto] : [];
        this.state.photoIdx = 0;
        this.state.currentPhotoUrl = null;
        this.showCurrentPhoto();

        this.showPerformer();
    }

    // ---- Fetch All Photos for Current Performer ----
    async fetchPerformerPhotos(slug) {
        this.photoOverlay.classList.remove('hidden');
        try {
            const res = await fetch(`/api/star-photos?slug=${encodeURIComponent(slug)}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            if (data.photos && data.photos.length > 0) {
                // Always skip the first photo if we have more than 1 photo
                this.state.photos = data.photos.length > 1 ? data.photos.slice(1) : data.photos;
                this.state.photoIdx = 0;
                // If API found a better name, update it
                if (data.name && data.name !== slug) {
                    const cleanedName = cleanPerformerName(data.name);
                    this.nameInput.value = cleanedName;
                    this.state.current.name = cleanedName;

                    // --- Auto-skip: real name may differ from slug name and already exist ---
                    if (this._isAlreadyAdded(data.name)) {
                        this.photoOverlay.classList.add('hidden');
                        console.log(`Auto-skipped: ${data.name} (already exists)`);
                        this.loadNextPerformer(true);
                        return;
                    }
                }
                this.showCurrentPhoto();
            }
        } catch (e) {
            // Stay with avatar
        } finally {
            this.photoOverlay.classList.add('hidden');
        }
    }

    // ---- Photo Navigation ----
    showCurrentPhoto() {
        const photos = this.state.photos;
        if (photos.length === 0) {
            this.photoEl.src = '';
            this.counterEl.textContent = '0 / 0';
            return;
        }

        const originalUrl = photos[this.state.photoIdx];
        const url1280 = originalUrl.replace(/(https:\/\/cdni\.pornpics\.com\/)460\//i, '$11280/');
        
        this.photoEl.style.opacity = '0.6';

        if (this.state.currentPhotoUrl !== originalUrl) {
            this.state.currentPhotoUrl = originalUrl;
            this.state.tryingFallback = false;
        }

        // Update search button
        const searchBtn = document.getElementById('smartSearchVideoBtn');
        if (searchBtn) {
            if (this.state.current?.name) {
                searchBtn.href = `https://www.google.com/search?tbm=vid&q=${encodeURIComponent(this.state.current.name + ' porn video')}`;
                searchBtn.classList.remove('hidden');
            } else {
                searchBtn.classList.add('hidden');
            }
        }

        if (!this.state.tryingFallback && url1280 !== originalUrl) {
            this.photoEl.src = url1280;
        } else {
            this.photoEl.src = originalUrl;
        }

        this.photoEl.onload = () => { this.photoEl.style.opacity = '1'; };
        
        this.photoEl.onerror = () => {
            if (!this.state.tryingFallback && url1280 !== originalUrl) {
                // 1280 failed, fallback to original
                this.state.tryingFallback = true;
                this.photoEl.src = originalUrl;
                return;
            }

            // Both failed, remove broken photo and try next
            this.state.photos.splice(this.state.photoIdx, 1);
            if (this.state.photos.length > 0) {
                this.state.photoIdx = Math.min(this.state.photoIdx, this.state.photos.length - 1);
                this.state.currentPhotoUrl = null; // Reset fallback for next photo
                this.showCurrentPhoto();
            } else {
                this.photoEl.src = '';
                this.counterEl.textContent = '0 / 0';
            }
        };
        this.counterEl.textContent = `${this.state.photoIdx + 1} / ${photos.length}`;

        // Update arrow visibility
        document.getElementById('smartPhotoPrev').style.opacity = photos.length > 1 ? '0.7' : '0.2';
        document.getElementById('smartPhotoNext').style.opacity = photos.length > 1 ? '0.7' : '0.2';
    }

    prevPhoto() {
        if (this.state.photos.length <= 1) return;
        this.state.photoIdx = (this.state.photoIdx - 1 + this.state.photos.length) % this.state.photos.length;
        this.state.currentPhotoUrl = null;
        this.showCurrentPhoto();
    }

    nextPhoto() {
        if (this.state.photos.length <= 1) return;
        this.state.photoIdx = (this.state.photoIdx + 1) % this.state.photos.length;
        this.state.currentPhotoUrl = null;
        this.showCurrentPhoto();
    }

    // ---- Label Pills ----
    renderLabelPills(activeLabels) {
        this.labelPills.innerHTML = '';
        
        const rawName = this.nameInput.value ? this.nameInput.value.trim() : '';
        const nameLabel = rawName ? cleanPerformerName(rawName).toLowerCase() : '';
        
        // Display performer name as a visual-only badge
        if (nameLabel) {
            const nameEl = document.createElement('div');
            nameEl.className = 'label-cb-pill';
            nameEl.style.backgroundColor = 'var(--primary)';
            nameEl.style.color = '#fff';
            nameEl.style.borderColor = 'var(--primary)';
            nameEl.style.cursor = 'default';
            nameEl.innerHTML = `<span>👤 ${nameLabel}</span>`;
            nameEl.title = "Performer Name (Not saved as a custom label)";
            this.labelPills.appendChild(nameEl);
        }
        
        const allLabels = this.app.store.customLabels || [];

        if (allLabels.length === 0) {
            if (!nameLabel) {
                this.labelPills.innerHTML = '<span style="font-size:0.8rem;color:var(--text-muted)">No labels</span>';
            }
            return;
        }

        allLabels.forEach(label => {
            const isChecked = activeLabels.includes(label);
            const el = document.createElement('label');
            el.className = 'label-cb-pill';
            el.innerHTML = `<input type="checkbox" value="${label}" ${isChecked ? 'checked' : ''} style="display:none;"><span>${label}</span>`;
            this.labelPills.appendChild(el);
        });
    }

    // ---- Add Current Performer ----
    async addCurrentPerformer() {
        const name     = cleanPerformerName(this.nameInput.value);
        const category = this.catSelect.value;
        const photoUrl = this.photoEl.src || '';
        const labels   = Array.from(this.labelPills.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);

        if (!name || !photoUrl) {
            this.app.showToast('Name and photo are required', 'error');
            return;
        }

        const btn = document.getElementById('smartSaveAddBtn');
        btn.disabled = true;
        btn.textContent = 'Saving...';

        // --- Bug #2 Fix: only proceed to next performer on success ---
        // --- Bug #3 Fix: synchronous addCharacter errors are now caught correctly ---
        let success = false;
        try {
            this.app.store.addCharacter(name, category, photoUrl, labels);
            success = true;
            this.state.addedCount++;
            this.app.showToast(`✅ ${name} added!`);
            this.app.renderGallery();
            this.app.renderHome();
        } catch (err) {
            // Show the error (e.g. duplicate name, storage full) and stay on current performer
            this.app.showToast(`${err.message}`, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Add & Next ✅';
        }

        // Only advance if the add was successful
        if (success) {
            this.loadNextPerformer();
        }
    }

    // ---- Skip Current Performer ----
    skipCurrentPerformer() {
        this.loadNextPerformer();
    }

    // ---- Load More from Next Page ----
    async loadMorePerformers() {
        const queueBefore = this.state.queue.length;
        await this.fetchPerformers();
        if (this.state.fetchFailed) {
            this.showEmpty('error');
            return;
        }
        if (this.state.queue.length > queueBefore) {
            this.loadNextPerformer();
        } else if (!this.state.hasMore) {
            // API returned zero performers — we've truly reached the end
            this.app.showToast('No more performers found!', 'error');
            this.showEmpty('done');
        } else {
            // All performers on this page exist in the collection.
            // Show the empty state and let the user decide if they want to click manually again.
            this.app.showToast('All performers on this page already exist in your collection.', 'info');
            this.showEmpty('done');
        }
    }

    // ---- Retry after a failed fetch ----
    async retryFetch() {
        this.state.fetchFailed = false;
        this.showLoading(`Retrying page ${this.state.currentPage}...`);
        await this.fetchPerformers();
        if (this.state.fetchFailed) {
            this.showEmpty('error');
        } else if (this.state.queue.length > 0) {
            this.loadNextPerformer();
        } else if (!this.state.hasMore) {
            this.showEmpty('done');
        } else {
            this.app.showToast('All performers on this page already exist in your collection.', 'info');
            this.showEmpty('done');
        }
    }
}

// Initialize App
const app = new App();

