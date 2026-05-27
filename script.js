const calculator = document.getElementById('calculator');
const modeToggle = document.getElementById('modeToggle');
const standardText = document.getElementById('standardText');
const engineeringText = document.getElementById('engineeringText');
const expressionDisplay = document.getElementById('expression');
const resultDisplay = document.getElementById('result');

let currentExpression = '';
let hasEvaluated = false;
let memoryValue = 0;
let ansValue = 0;
let isDegMode = true;
let mathScope = {}; // Persistent scope for variables

// Initialize Mode
standardText.classList.add('active');

// Override trig functions to support DEG/RAD mode
if (typeof math !== 'undefined') {
    const originalTrig = {
        sin: math.sin,
        cos: math.cos,
        tan: math.tan,
        asin: math.asin,
        acos: math.acos,
        atan: math.atan
    };

    math.import({
        sin: function(x) { return isDegMode ? originalTrig.sin(x * Math.PI / 180) : originalTrig.sin(x); },
        cos: function(x) { return isDegMode ? originalTrig.cos(x * Math.PI / 180) : originalTrig.cos(x); },
        tan: function(x) { return isDegMode ? originalTrig.tan(x * Math.PI / 180) : originalTrig.tan(x); },
        asin: function(x) { return isDegMode ? originalTrig.asin(x) * 180 / Math.PI : originalTrig.asin(x); },
        acos: function(x) { return isDegMode ? originalTrig.acos(x) * 180 / Math.PI : originalTrig.acos(x); },
        atan: function(x) { return isDegMode ? originalTrig.atan(x) * 180 / Math.PI : originalTrig.atan(x); }
    }, {override: true});
}

// Tab Switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.eng-panel-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        const tabId = btn.dataset.tab;
        const targetContent = document.getElementById('tab-' + tabId);
        if (targetContent) {
            targetContent.classList.add('active');
        }
    });
});

// Mode Toggle Event
modeToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
        calculator.classList.add('engineering-mode');
        engineeringText.classList.add('active');
        standardText.classList.remove('active');
    } else {
        calculator.classList.remove('engineering-mode');
        standardText.classList.add('active');
        engineeringText.classList.remove('active');
    }
});

// Helper to update display
function updateDisplay(value) {
    // Scroll to right if text is long
    resultDisplay.textContent = value || '0';
    resultDisplay.scrollLeft = resultDisplay.scrollWidth;
}

// Button Click Handling
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const value = btn.dataset.value;

        // Visual feedback for click
        btn.style.transform = 'scale(0.9)';
        setTimeout(() => btn.style.transform = '', 150);

        if (action === 'clear') {
            currentExpression = '';
            expressionDisplay.textContent = '';
            updateDisplay('0');
            hasEvaluated = false;
        } 
        else if (action === 'delete') {
            if (hasEvaluated) {
                expressionDisplay.textContent = '';
                hasEvaluated = false;
            }
            currentExpression = currentExpression.toString().slice(0, -1);
            updateDisplay(currentExpression);
        } 
        else if (action === 'calculate') {
            try {
                if (!currentExpression) return;
                
                // Evaluate expression using math.js safely with persistent scope
                const result = math.evaluate(currentExpression, mathScope);
                
                // Format result (prevent floating point artifacts like 0.30000000000000004)
                let formattedResult = math.format(result, { precision: 14 });
                
                expressionDisplay.textContent = currentExpression + ' =';
                updateDisplay(formattedResult);
                
                ansValue = formattedResult;
                currentExpression = formattedResult.toString();
                hasEvaluated = true;
            } catch (error) {
                console.error("Calculation Error:", error);
                updateDisplay('Error');
                setTimeout(() => {
                    if (resultDisplay.textContent === 'Error') {
                        updateDisplay(currentExpression);
                    }
                }, 1500);
            }
        }
        else if (action === 'toggle-deg') {
            isDegMode = !isDegMode;
            btn.textContent = isDegMode ? 'DEG' : 'RAD';
            btn.classList.toggle('active', !isDegMode);
        }
        else if (action === 'clearVars') {
            mathScope = {};
            currentExpression = '';
            expressionDisplay.textContent = 'Variables Cleared';
            updateDisplay('0');
            hasEvaluated = false;
        }
        else if (action === 'memory') {
            const currentValue = parseFloat(resultDisplay.textContent) || 0;
            switch(value) {
                case 'mc':
                    memoryValue = 0;
                    break;
                case 'mr':
                    if (hasEvaluated) {
                        currentExpression = memoryValue.toString();
                    } else {
                        currentExpression += memoryValue.toString();
                    }
                    updateDisplay(currentExpression);
                    hasEvaluated = false;
                    break;
                case 'm+':
                    memoryValue += currentValue;
                    hasEvaluated = true;
                    break;
                case 'm-':
                    memoryValue -= currentValue;
                    hasEvaluated = true;
                    break;
            }
        }
        else if (action === 'ans') {
            if (hasEvaluated) {
                currentExpression = ansValue.toString();
            } else {
                currentExpression += ansValue.toString();
            }
            updateDisplay(currentExpression);
            hasEvaluated = false;
        }
        else { // Action is either 'math' or 'number'
            if (hasEvaluated) {
                if (action === 'number') {
                    // Start new expression
                    currentExpression = value;
                } else if (action === 'math') {
                    // Continue with previous result
                    currentExpression += value;
                }
                expressionDisplay.textContent = '';
                hasEvaluated = false;
            } else {
                currentExpression += value;
            }
            updateDisplay(currentExpression);
        }
    });
});

// Keyboard support
document.addEventListener('keydown', (e) => {
    const key = e.key;
    
    // Map keys to buttons
    let btnSelector = null;
    
    if (/[0-9\.]/.test(key)) {
        btnSelector = `.btn[data-value="${key}"]`;
    } else if (['+', '-', '*', '/', '(', ')', '^', '!', ',', ';', '[', ']', '=', 'x', 'y', 'z', '%'].includes(key)) {
        btnSelector = `.btn[data-value="${key}"]`;
    } else if (key === 'Enter') {
        btnSelector = `.btn[data-action="calculate"]`;
        e.preventDefault(); // prevent form submit/scroll
    } else if (key === 'Backspace') {
        btnSelector = `.btn[data-action="delete"]`;
    } else if (key === 'Escape') {
        btnSelector = `.btn[data-action="clear"]`;
    }
    
    if (btnSelector) {
        const btn = document.querySelector(btnSelector);
        if (btn) btn.click();
        else {
            // If the key is valid math input but not found on visible keypad, 
            // still append it if it's a simple character like x,y,z or operators
            if (['+', '-', '*', '/', '(', ')', '^', '!', ',', ';', '[', ']', '=', 'x', 'y', 'z', '%'].includes(key) || /[0-9\.]/.test(key)) {
                if (hasEvaluated) {
                    currentExpression = key;
                    hasEvaluated = false;
                    expressionDisplay.textContent = '';
                } else {
                    currentExpression += key;
                }
                updateDisplay(currentExpression);
            }
        }
    }
});
