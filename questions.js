'use strict';

/**
 * QuestionBank centralises question generation so each grade can supply a dedicated stage set.
 */
const QuestionBank = (() => {
    const DEFAULT_GRADE_RANGE = { min: 0, max: 13 };

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function createAdditionStage(stageNumber, name, maxTotal) {
        return {
            stageNumber,
            name,
            generateQuestion: () => {
                const a = randomInt(0, maxTotal);
                const b = randomInt(0, Math.max(0, maxTotal - a));
                const sum = a + b;
                return {
                    questionText: `${a} + ${b} = ?`,
                    correctAnswer: sum,
                    operands: [a, b],
                    answerRangeMax: maxTotal,
                    key: `${stageNumber}|${a}|${b}`,
                    operationType: a === b ? 'double-add' : null
                };
            }
        };
    }

    function createSubtractionStage(stageNumber, name, maxValue) {
        return {
            stageNumber,
            name,
            generateQuestion: () => {
                const a = randomInt(0, maxValue);
                const b = randomInt(0, a);
                const diff = a - b;
                return {
                    questionText: `${a} - ${b} = ?`,
                    correctAnswer: diff,
                    operands: [a, b],
                    answerRangeMax: maxValue,
                    key: `${stageNumber}|${a}|${b}`,
                    operationType: a === b ? 'double-sub' : null
                };
            }
        };
    }

    function createMissingAdditionStage(stageNumber, name, maxTotal) {
        return {
            stageNumber,
            name,
            generateQuestion: () => {
                const a = randomInt(0, maxTotal);
                const missing = randomInt(0, Math.max(0, maxTotal - a));
                const b = missing + a;
                return {
                    questionText: `? + ${a} = ${b}`,
                    correctAnswer: missing,
                    operands: [a, b],
                    answerRangeMax: maxTotal,
                    key: `${stageNumber}|${a}|${b}`,
                    operationType: null
                };
            }
        };
    }

    function createMissingSubtractionStage(stageNumber, name, maxValue) {
        return {
            stageNumber,
            name,
            generateQuestion: () => {
                const a = randomInt(0, maxValue);
                const missing = randomInt(0, a);
                const b = a - missing;
                return {
                    questionText: `${a} - ? = ${b}`,
                    correctAnswer: missing,
                    operands: [a, b],
                    answerRangeMax: maxValue,
                    key: `${stageNumber}|${a}|${b}`,
                    operationType: null
                };
            }
        };
    }

    function createTripleAdditionStage(stageNumber, name, maxTotal) {
        return {
            stageNumber,
            name,
            generateQuestion: () => {
                const a = randomInt(0, maxTotal);
                const remainingAfterA = Math.max(0, maxTotal - a);
                const b = randomInt(0, remainingAfterA);
                const maxForC = Math.max(0, maxTotal - a - b);
                const c = randomInt(0, maxForC);
                const sum = a + b + c;
                const operationType = (a === b && b === c) ? 'triple-add' : null;
                return {
                    questionText: `${a} + ${b} + ${c} = ?`,
                    correctAnswer: sum,
                    operands: [a, b, c],
                    answerRangeMax: maxTotal,
                    key: `${stageNumber}|${a}|${b}|${c}`,
                    operationType
                };
            }
        };
    }

    function normalizeStageDefinition(stageDef, index) {
        const stageNumber = typeof stageDef.stageNumber === 'number' ? stageDef.stageNumber : index + 1;
        if(typeof stageDef.generateQuestion !== 'function') {
            throw new Error('Stage definition must provide a generateQuestion function.');
        }
        return {
            stageNumber,
            name: stageDef.name || `Kolo ${stageNumber}`,
            generateQuestion: stageDef.generateQuestion
        };
    }

    function createGradeConfig(config) {
        const stages = Array.isArray(config.stages) ? config.stages : [];
        const normalizedStages = stages.map(normalizeStageDefinition);
        if(normalizedStages.length === 0) {
            throw new Error('Grade config must define at least one stage.');
        }
        return {
            id: config.id || 'custom',
            stages: normalizedStages
        };
    }

    const defaultStages = [
        createAdditionStage(1, 'Kouzelný les', 10),
        createSubtractionStage(2, 'Kamenné hory', 10),
        createMissingAdditionStage(3, 'Sopečný kráter', 10),
        createMissingSubtractionStage(4, 'Zamrzlé pustiny', 10),
        createAdditionStage(5, 'Stínová říše', 20),
        createSubtractionStage(6, 'Křišťálové jeskyně', 20),
        createTripleAdditionStage(7, 'Bouřné vrchy', 10),
        createTripleAdditionStage(8, 'Tavené jádro', 20),
        createAdditionStage(9, 'Království smrti', 30),
        createSubtractionStage(10, 'Dračí doupě', 30)
    ];

    const defaultConfig = createGradeConfig({
        id: 'default',
        stages: defaultStages
    });

    const gradeConfigMap = new Map();
    for(let grade = DEFAULT_GRADE_RANGE.min; grade <= DEFAULT_GRADE_RANGE.max; grade++) {
        gradeConfigMap.set(grade, defaultConfig);
    }

    function resolveGradeConfig(grade) {
        if(typeof grade === 'number' && !Number.isNaN(grade) && gradeConfigMap.has(grade)) {
            return gradeConfigMap.get(grade);
        }
        return defaultConfig;
    }

    function getStageDefinition(grade, stageNumber) {
        const config = resolveGradeConfig(grade);
        if(!config.stages.length) {
            return null;
        }

        const index = stageNumber - 1;
        if(index >= 0 && index < config.stages.length) {
            return config.stages[index];
        }

        const fallback = defaultConfig;
        if(index >= 0 && index < fallback.stages.length) {
            return fallback.stages[index];
        }

        return fallback.stages[fallback.stages.length - 1] || null;
    }

    function generateQuestion(grade, stageNumber) {
        const definition = getStageDefinition(grade, stageNumber);
        if(!definition) {
            return null;
        }

        const payload = definition.generateQuestion();
        if(payload && (typeof payload.key !== 'string' || !payload.key)) {
            const operandsPart = Array.isArray(payload.operands) && payload.operands.length > 0
                ? payload.operands.join('|')
                : payload.correctAnswer;
            payload.key = `${definition.stageNumber}|${operandsPart}|${payload.correctAnswer}`;
        }
        if(payload && payload.operationType === undefined) {
            payload.operationType = null;
        }
        return payload;
    }

    function getStageCount(grade) {
        const config = resolveGradeConfig(grade);
        return config.stages.length;
    }

    function getStageName(grade, stageNumber) {
        const definition = getStageDefinition(grade, stageNumber);
        return definition && definition.name ? definition.name : `Kolo ${stageNumber}`;
    }

    function setGradeConfig(gradeIdentifiers, config) {
        const normalized = createGradeConfig(config);
        const targets = Array.isArray(gradeIdentifiers) ? gradeIdentifiers : [gradeIdentifiers];
        targets.forEach(target => {
            const numericGrade = typeof target === 'number' ? target : parseInt(target, 10);
            if(Number.isNaN(numericGrade)) {
                return;
            }
            gradeConfigMap.set(numericGrade, normalized);
        });
    }

    function getGradeConfig(grade) {
        return resolveGradeConfig(grade);
    }

    return {
        generateQuestion,
        getStageCount,
        getStageName,
        setGradeConfig,
        getGradeConfig
    };
})();
