document.addEventListener('DOMContentLoaded', () => {
    // App state management
    const appState = {
        currentActivity: 'animals',
        audioContext: null,
        gainNode: null,
        currentAlphabetIndex: 0,
        selectedColor: '#FF0000', // Default coloring color
        quizCurrentQuestion: null,
        quizAnsweredCorrectly: false,
        currentRhymeAudio: null, // Track currently playing HTML5 audio
        soundSources: [], // Track Web Audio API sources for stopping
    };

    // Utility functions for audio
    function initAudioContext() {
        if (!appState.audioContext) {
            appState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            appState.gainNode = appState.audioContext.createGain();
            appState.gainNode.connect(appState.audioContext.destination);
            appState.gainNode.gain.value = 0.8; // Reduce volume slightly
        }
    }

    // Play short sound using Web Audio API (for taps, feedback)
    function playSound(frequency, duration, type, onEnded) {
        initAudioContext();
        const oscillator = appState.audioContext.createOscillator();
        oscillator.type = type; // 'sine', 'square', 'sawtooth', 'triangle'
        oscillator.frequency.setValueAtTime(frequency, appState.audioContext.currentTime);
        oscillator.connect(appState.gainNode);
        oscillator.start();

        appState.soundSources.push(oscillator); // Track for stopping
        oscillator.stop(appState.audioContext.currentTime + duration);

        oscillator.onended = () => {
            oscillator.disconnect();
            appState.soundSources = appState.soundSources.filter(s => s !== oscillator);
            if (onEnded) onEnded();
        };
    }

    // Play longer audio using HTML5 Audio API (for animal sounds, rhymes)
    function playHtmlAudio(url, loop = false, onEndedCallback = null) {
        stopAllAudio(); // Stop any previous HTML5 audio

        appState.currentRhymeAudio = new Audio(url);
        appState.currentRhymeAudio.loop = loop;
        appState.currentRhymeAudio.volume = 0.8;
        appState.currentRhymeAudio.play().catch(e => console.error("Audio playback error:", e));

        if (onEndedCallback) {
            appState.currentRhymeAudio.onended = () => {
                onEndedCallback();
                appState.currentRhymeAudio = null;
            };
        } else {
            appState.currentRhymeAudio.onended = () => {
                appState.currentRhymeAudio = null;
            };
        }
    }

    function stopAllAudio(keepWebAudio = false) {
        // Stop HTML5 audio
        if (appState.currentRhymeAudio) {
            appState.currentRhymeAudio.pause();
            appState.currentRhymeAudio.currentTime = 0;
            appState.currentRhymeAudio = null;
        }
        // Stop Web Audio API sounds
        if (!keepWebAudio && appState.soundSources.length > 0) {
            appState.soundSources.forEach(source => {
                try {
                    source.stop();
                    source.disconnect();
                } catch (e) {
                    console.warn("Error stopping audio source:", e);
                }
            });
            appState.soundSources = [];
        }
    }

    // UI feedback animation
    function triggerBounce(element) {
        element.style.transition = 'none';
        element.style.transform = 'scale(1.1)';
        setTimeout(() => {
            element.style.transition = 'transform 0.2s ease-out';
            element.style.transform = 'scale(1)';
        }, 50);
    }

    // Data for activities
    const animalData = [
        { name: "Cow", sound: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", image: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f42e.png" }, // Placeholder audio
        { name: "Dog", sound: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", image: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f436.png" },
        { name: "Cat", sound: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", image: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f431.png" },
        { name: "Lion", sound: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", image: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f981.png" },
        { name: "Elephant", sound: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", image: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f418.png" },
        { name: "Horse", sound: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", image: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f434.png" },
        { name: "Duck", sound: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3", image: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f986.png" },
    ];

    const alphabetData = [
        { letter: 'A', word: 'Apple', image: 'https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f34e.png', sound: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
        { letter: 'B', word: 'Ball', image: 'https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u26bd.png', sound: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3" },
        { letter: 'C', word: 'Cat', image: 'https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f431.png', sound: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3" },
        { letter: 'D', word: 'Dog', image: 'https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f436.png', sound: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3" },
        { letter: 'E', word: 'Egg', image: 'https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f95a.png', sound: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3" },
        { letter: 'F', word: 'Fish', image: 'https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f41f.png', sound: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3" },
    ];

    const rhymeData = [
        { title: "Twinkle Twinkle Little Star", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3", icon: "✨" },
        { title: "Bounce Bounce Boo!", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3", icon: "🥳" },
        { title: "ABC Alphabet Song for Kids", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3", icon: "🎵" },
        { title: "Wheels on the Bus", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3", icon: "🚌" },
    ];

    const coloringColors = [
        '#FF0000', '#FFA500', '#FFFF00', '#008000', '#0000FF', '#4B0082', '#EE82EE', // Rainbow
        '#FFC0CB', '#800000', '#00FFFF', '#000000', '#FFFFFF', '#808080', '#A52A2A' // Extras
    ];

    const quizQuestions = [
        {
            question: "What animal says 'Moo'?",
            image: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f42e.png", // Cow
            options: [
                { text: "Cow", image: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f42e.png", isCorrect: true },
                { text: "Cat", image: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f431.png", isCorrect: false },
                { text: "Dog", image: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f436.png", isCorrect: false },
            ]
        },
        {
            question: "Which one is an Apple?",
            image: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f34e.png", // Apple
            options: [
                { text: "Banana", image: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f34c.png", isCorrect: false },
                { text: "Apple", image: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f34e.png", isCorrect: true },
                { text: "Orange", image: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f34a.png", isCorrect: false },
            ]
        },
        {
            question: "Find the Triangle!",
            image: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f53a.png", // Up-pointing red triangle
            options: [
                { text: "Circle", image: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u26ab.png", isCorrect: false },
                { text: "Square", image: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u25a0.png", isCorrect: false },
                { text: "Triangle", image: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u1f53a.png", isCorrect: true },
            ]
        }
    ];

    // UI Elements
    const activityContainers = document.querySelectorAll('.activity-container');
    const navButtons = document.querySelectorAll('.nav-button');
    const animalsGrid = document.querySelector('.animals-grid');

    const alphabetLetter = document.getElementById('alphabetLetter');
    const alphabetImage = document.getElementById('alphabetImage');
    const alphabetWord = document.getElementById('alphabetWord');
    const prevAlphabetBtn = document.getElementById('prevAlphabet');
    const nextAlphabetBtn = document.getElementById('nextAlphabet');

    const rhymesList = document.querySelector('.rhymes-list');

    const coloringCanvas = document.getElementById('coloringCanvas');
    const coloringContext = coloringCanvas.getContext('2d');
    const colorPalette = document.querySelector('.color-palette');
    const clearCanvasBtn = document.getElementById('clearCanvas');

    const quizQuestionText = document.getElementById('quizQuestionText');
    const quizQuestionImage = document.getElementById('quizQuestionImage');
    const quizOptionsContainer = document.getElementById('quizOptions');

    const parentsCornerModal = document.getElementById('parentsCornerModal');

    // --- Activity Switching Logic ---
    function showActivity(activityId) {
        stopAllAudio(); // Stop audio when switching activities

        activityContainers.forEach(container => {
            container.classList.remove('active');
        });
        document.getElementById(`${activityId}-activity`).classList.add('active');

        navButtons.forEach(button => {
            button.classList.remove('active');
            if (button.dataset.activity === activityId) {
                button.classList.add('active');
            }
        });

        appState.currentActivity = activityId;
        initializeActivity(activityId);
    }

    function initializeActivity(activityId) {
        switch (activityId) {
            case 'animals':
                renderAnimals();
                break;
            case 'alphabet':
                appState.currentAlphabetIndex = 0;
                displayAlphabetLetter(appState.currentAlphabetIndex);
                break;
            case 'rhymes':
                renderRhymes();
                break;
            case 'coloring':
                initializeColoringCanvas();
                renderColorPalette();
                break;
            case 'quiz':
                startQuiz();
                break;
        }
    }

    // --- Event Listeners for Navigation ---
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            showActivity(button.dataset.activity);
        });
    });

    // --- Animals Activity ---
    function renderAnimals() {
        animalsGrid.innerHTML = '';
        animalData.forEach(animal => {
            const card = document.createElement('div');
            card.classList.add('animal-card');
            card.innerHTML = `
                        <img src="${animal.image}" alt="${animal.name}">
                        <span>${animal.name}</span>
                    `;
            card.addEventListener('click', () => {
                playHtmlAudio(animal.sound);
                triggerBounce(card);
            });
            animalsGrid.appendChild(card);
        });
    }

    // --- Alphabet Activity ---
    function displayAlphabetLetter(index) {
        const data = alphabetData[index];
        alphabetLetter.textContent = data.letter;
        alphabetImage.src = data.image;
        alphabetWord.textContent = data.word;

        alphabetLetter.onclick = () => { playHtmlAudio(data.sound); triggerBounce(alphabetLetter); };
        alphabetImage.parentElement.onclick = () => { playHtmlAudio(data.sound); triggerBounce(alphabetImage.parentElement); };
        alphabetWord.onclick = () => { playHtmlAudio(data.sound); triggerBounce(alphabetWord); };
    }

    prevAlphabetBtn.addEventListener('click', () => {
        appState.currentAlphabetIndex = (appState.currentAlphabetIndex - 1 + alphabetData.length) % alphabetData.length;
        displayAlphabetLetter(appState.currentAlphabetIndex);
    });

    nextAlphabetBtn.addEventListener('click', () => {
        appState.currentAlphabetIndex = (appState.currentAlphabetIndex + 1) % alphabetData.length;
        displayAlphabetLetter(appState.currentAlphabetIndex);
    });

    // --- Rhymes Activity ---
    function renderRhymes() {
        rhymesList.innerHTML = '';
        rhymeData.forEach(rhyme => {
            const card = document.createElement('div');
            card.classList.add('rhyme-card');
            card.innerHTML = `
                        <div class="icon">${rhyme.icon}</div>
                        <span>${rhyme.title}</span>
                        <div class="rhyme-animation-area"></div>
                    `;
            card.addEventListener('click', () => {
                handleRhymePlay(card, rhyme.audio);
                triggerBounce(card);
            });
            rhymesList.appendChild(card);
        });
    }

    function handleRhymePlay(cardElement, audioUrl) {
        const animationArea = cardElement.querySelector('.rhyme-animation-area');

        const onAudioEnded = () => {
            animationArea.innerHTML = ''; // Clear notes when audio ends
        };

        playHtmlAudio(audioUrl, false, onAudioEnded);

        // Start note animations
        animationArea.innerHTML = ''; // Clear previous notes
        const noteInterval = setInterval(() => {
            if (!appState.currentRhymeAudio || appState.currentRhymeAudio.paused) {
                clearInterval(noteInterval);
                animationArea.innerHTML = '';
                return;
            }
            const note = document.createElement('div');
            note.classList.add('musical-note');
            note.textContent = '🎵';

            const startX = Math.random() * animationArea.offsetWidth;
            const startY = animationArea.offsetHeight - 20; // Start from bottom

            note.style.left = `${startX}px`;
            note.style.top = `${startY}px`;
            note.style.setProperty('--dx', `${(Math.random() - 0.5) * 100}px`);
            note.style.setProperty('--dy', `${-Math.random() * 100 - 50}px`); // Float upwards

            animationArea.appendChild(note);
            // Remove note after animation to prevent DOM clutter
            note.addEventListener('animationend', () => note.remove());
        }, 300); // Create a new note every 300ms
    }


    // --- Coloring Activity ---
    let isDrawing = false;
    function initializeColoringCanvas() {
        const img = new Image();
        img.onload = () => {
            coloringContext.clearRect(0, 0, coloringCanvas.width, coloringCanvas.height);
            coloringContext.fillStyle = 'white';
            coloringContext.fillRect(0, 0, coloringCanvas.width, coloringCanvas.height);
            coloringContext.drawImage(img, 0, 0, coloringCanvas.width, coloringCanvas.height);
        };
        // Example drawing outline (a simple flower and butterfly)
        // In a real app, this would be a single, pre-made outline image
        img.src = "data:image/svg+xml,%3Csvg width='400' height='300' viewBox='0 0 400 300' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3C!-- Flower --%3E%3Cpath d='M200 150 C220 120, 230 80, 200 70 C170 80, 180 120, 200 150Z' stroke='black' stroke-width='2' fill='white'/%3E%3Cpath d='M200 150 C170 120, 160 80, 190 70 C220 80, 210 120, 200 150Z' stroke='black' stroke-width='2' fill='white'/%3E%3Cpath d='M200 150 C230 140, 240 100, 220 90 C200 100, 210 140, 200 150Z' stroke='black' stroke-width='2' fill='white'/%3E%3Cpath d='M200 150 C170 140, 160 100, 180 90 C200 100, 190 140, 200 150Z' stroke='black' stroke-width='2' fill='white'/%3E%3Ccircle cx='200' cy='100' r='15' stroke='black' stroke-width='2' fill='yellow'/%3E%3C!-- Butterfly --%3E%3Cpath d='M100 200 C80 180, 60 180, 50 200 C60 220, 80 220, 100 200Z' stroke='black' stroke-width='2' fill='white'/%3E%3Cpath d='M100 200 C80 220, 60 220, 50 200 C60 180, 80 180, 100 200Z' stroke='black' stroke-width='2' fill='white'/%3E%3Cpath d='M100 200 C120 180, 140 180, 150 200 C140 220, 120 220, 100 200Z' stroke='black' stroke-width='2' fill='white'/%3E%3Cpath d='M100 200 C120 220, 140 220, 150 200 C140 180, 120 180, 100 200Z' stroke='black' stroke-width='2' fill='white'/%3E%3Ccircle cx='100' cy='200' r='10' stroke='black' stroke-width='2' fill='brown'/%3E%3C/svg%3E";


        // Set up event listeners for coloring
        coloringCanvas.addEventListener('mousedown', startFill);
        coloringCanvas.addEventListener('touchstart', startFill);

        clearCanvasBtn.addEventListener('click', () => {
            initializeColoringCanvas(); // Redraws the initial outline
            playSound(400, 0.1, 'sine');
        });
    }

    function renderColorPalette() {
        colorPalette.innerHTML = '';
        coloringColors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.classList.add('color-swatch');
            if (color === appState.selectedColor) {
                swatch.classList.add('selected');
            }
            swatch.style.backgroundColor = color;
            swatch.dataset.color = color;
            swatch.addEventListener('click', () => selectColor(color));
            colorPalette.appendChild(swatch);
        });
    }

    function selectColor(color) {
        appState.selectedColor = color;
        document.querySelectorAll('.color-swatch').forEach(s => {
            s.classList.remove('selected');
            if (s.dataset.color === color) {
                s.classList.add('selected');
            }
        });
        playSound(500, 0.05, 'triangle'); // Short high-pitched sound for color selection
    }

    function hexToRgba(hex, alpha = 255) {
        let r = 0, g = 0, b = 0;
        // 3 digits
        if (hex.length == 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        }
        // 6 digits
        else if (hex.length == 7) {
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        }
        return [r, g, b, alpha];
    }

    function getPixel(imageData, x, y) {
        const index = (y * imageData.width + x) * 4;
        return [imageData.data[index], imageData.data[index + 1], imageData.data[index + 2], imageData.data[index + 3]];
    }

    function setPixel(imageData, x, y, rgba) {
        const index = (y * imageData.width + x) * 4;
        imageData.data[index] = rgba[0];
        imageData.data[index + 1] = rgba[1];
        imageData.data[index + 2] = rgba[2];
        imageData.data[index + 3] = rgba[3];
    }

    function colorsMatch(color1, color2, tolerance = 50) { // Increased tolerance for anti-aliased lines
        return Math.abs(color1[0] - color2[0]) < tolerance &&
            Math.abs(color1[1] - color2[1]) < tolerance &&
            Math.abs(color1[2] - color2[2]) < tolerance &&
            Math.abs(color1[3] - color2[3]) < tolerance;
    }

    function startFill(event) {
        playSound(600, 0.1, 'sine'); // Sound on fill
        const rect = coloringCanvas.getBoundingClientRect();
        const scaleX = coloringCanvas.width / rect.width;
        const scaleY = coloringCanvas.height / rect.height;

        let clientX, clientY;
        if (event.touches) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }

        const x = Math.floor((clientX - rect.left) * scaleX);
        const y = Math.floor((clientY - rect.top) * scaleY);

        const imageData = coloringContext.getImageData(0, 0, coloringCanvas.width, coloringCanvas.height);
        const targetColor = getPixel(imageData, x, y);
        const fillColor = hexToRgba(appState.selectedColor);

        if (colorsMatch(targetColor, fillColor, 1)) { // Don't fill if already the same color
            return;
        }

        const stack = [[x, y]];
        const visited = new Set();
        const width = coloringCanvas.width;
        const height = coloringCanvas.height;

        while (stack.length > 0) {
            const [cx, cy] = stack.pop();
            const key = `${cx},${cy}`;

            if (cx < 0 || cx >= width || cy < 0 || cy >= height || visited.has(key)) {
                continue;
            }

            visited.add(key);

            if (colorsMatch(getPixel(imageData, cx, cy), targetColor)) {
                setPixel(imageData, cx, cy, fillColor);
                stack.push([cx + 1, cy]);
                stack.push([cx - 1, cy]);
                stack.push([cx, cy + 1]);
                stack.push([cx, cy - 1]);
            }
        }
        coloringContext.putImageData(imageData, 0, 0);
    }

    // --- Quiz Activity ---
    function startQuiz() {
        appState.quizCurrentQuestion = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
        appState.quizAnsweredCorrectly = false;
        displayQuizQuestion();
    }

    function displayQuizQuestion() {
        if (!appState.quizCurrentQuestion) return;

        quizQuestionText.textContent = appState.quizCurrentQuestion.question;
        quizQuestionImage.src = appState.quizCurrentQuestion.image;
        quizOptionsContainer.innerHTML = ''; // Clear previous options

        // Shuffle options
        const shuffledOptions = [...appState.quizCurrentQuestion.options].sort(() => Math.random() - 0.5);

        shuffledOptions.forEach(option => {
            const button = document.createElement('button');
            button.classList.add('quiz-option-button');
            button.innerHTML = `<img src="${option.image}" alt="${option.text}">`;
            button.addEventListener('click', () => handleQuizAnswer(button, option));
            quizOptionsContainer.appendChild(button);
        });
    }

    function handleQuizAnswer(button, option) {
        if (appState.quizAnsweredCorrectly) return; // Prevent multiple answers

        if (option.isCorrect) {
            playSound(700, 0.2, 'sine', () => { // Correct sound
                showStarAnimation(button);
                setTimeout(startQuiz, 1000); // Move to next question after 1s
            });
            button.classList.add('correct');
            appState.quizAnsweredCorrectly = true;
        } else {
            playSound(200, 0.2, 'square'); // Wrong sound
            button.classList.add('wrong');
            triggerBounce(button); // Shake wrong button
        }
    }

    function showStarAnimation(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 5; i++) { // Spawn multiple stars
            const star = document.createElement('div');
            star.classList.add('star-animation');
            star.textContent = '⭐';
            document.body.appendChild(star);

            // Random offset from center
            const dx = (Math.random() - 0.5) * 80;
            const dy = (Math.random() - 0.5) * 80;

            star.style.left = `${centerX + dx}px`;
            star.style.top = `${centerY + dy}px`;
            star.style.setProperty('--star-dx', `${(Math.random() - 0.5) * 150}px`);
            star.style.setProperty('--star-dy', `${(Math.random() - 0.5) * 150 - 50}px`); // Float slightly upwards

            star.addEventListener('animationend', () => star.remove());
        }
    }


    // --- Ad and Parent's Corner ---
    window.openAdLink = function () {
        console.log("Simulating ad click to NASA Kids");
        // In a real app, you'd open window.open here. For iframe context, just log.
        // window.open("https://www.nasa.gov/kids", "_blank");
    };

    window.toggleParentsCorner = function () {
        parentsCornerModal.classList.toggle('active');
        if (parentsCornerModal.classList.contains('active')) {
            playSound(440, 0.1, 'triangle'); // Sound for opening modal
        } else {
            playSound(330, 0.1, 'triangle'); // Sound for closing modal
        }
    };


    // Initial load
    showActivity('animals');
});