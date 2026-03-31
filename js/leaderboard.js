// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDTAl2cd38K1YIjQXoF4WtFYyuHULKlADk",
  authDomain: "cometho-cb1ce.firebaseapp.com",
  projectId: "cometho-cb1ce",
  storageBucket: "cometho-cb1ce.firebasestorage.app",
  messagingSenderId: "1024990432068",
  appId: "1:1024990432068:web:2955f5aec18c0908d22511"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Leaderboard Manager
class LeaderboardManager {
    constructor() {
        this.username = localStorage.getItem('username') || null;
        this.leaderboardList = document.getElementById('leaderboard-list');
        this.modal = document.getElementById('username-modal');
        this.usernameInput = document.getElementById('username-input');
        this.submitButton = document.getElementById('username-submit');
        
        this.init();
    }

    init() {
        if (!this.username) {
            this.showUsernamePrompt();
        } else {
            this.hideUsernamePrompt();
            this.loadLeaderboard();
        }

        this.submitButton.addEventListener('click', () => this.submitUsername());
        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitUsername();
        });
    }

    showUsernamePrompt() {
        this.modal.style.display = 'block';
        this.usernameInput.focus();
    }

    hideUsernamePrompt() {
        this.modal.style.display = 'none';
    }

    submitUsername() {
        const username = this.usernameInput.value.trim();
        if (username.length < 2) {
            alert('Username must be at least 2 characters long');
            return;
        }
        
        this.username = username;
        localStorage.setItem('username', username);
        this.hideUsernamePrompt();
        this.loadLeaderboard();
    }

    async saveScore(score, isWin) {
        if (!this.username) return;

        try {
            const scoreData = {
                username: this.username,
                score: score,
                isWin: isWin,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('scores').add(scoreData);
            this.loadLeaderboard();
        } catch (error) {
            console.error('Error saving score:', error);
        }
    }

    async loadLeaderboard() {
        try {
            const snapshot = await db.collection('scores')
                .orderBy('score', 'desc')
                .orderBy('timestamp', 'desc')
                .limit(50)
                .get();

            const scores = [];
            const seenUsers = new Set();

            snapshot.forEach(doc => {
                const data = doc.data();
                if (!seenUsers.has(data.username)) {
                    seenUsers.add(data.username);
                    scores.push(data);
                }
            });

            // Sort by score descending, then by win status (wins first), then by timestamp
            scores.sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                if (b.isWin !== a.isWin) return b.isWin ? 1 : -1;
                return a.timestamp - b.timestamp;
            });

            this.displayLeaderboard(scores.slice(0, 20));
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            this.displayError();
        }
    }

    displayLeaderboard(scores) {
        this.leaderboardList.innerHTML = '';

        if (scores.length === 0) {
            this.leaderboardList.innerHTML = '<div class="leaderboard-item">No scores yet</div>';
            return;
        }

        scores.forEach((score, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            
            const star = score.isWin ? '<span class="leaderboard-star">⭐</span>' : '';
            
            item.innerHTML = `
                <span class="leaderboard-rank">#${index + 1}</span>
                <span class="leaderboard-username">${score.username}</span>
                <span class="leaderboard-score">${score.score}${star}</span>
            `;
            
            this.leaderboardList.appendChild(item);
        });
    }

    displayError() {
        this.leaderboardList.innerHTML = '<div class="leaderboard-item">Error loading leaderboard</div>';
    }
}

// Initialize leaderboard manager
let leaderboardManager;

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    leaderboardManager = new LeaderboardManager();
});
