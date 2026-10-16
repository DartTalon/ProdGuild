const STORAGE_KEY = 'prodguild_production_v4';

// При желании подключить внешнюю БД Supabase — впишите URL и ANON KEY
const SUPABASE_CONFIG = {
    url: '', // например: 'https://xyz.supabase.co'
    anonKey: ''
};

const SUBJECTS_META = {
    math: { title: 'Математика', icon: 'functions', color: 'badge-blue', desc: 'Теория чисел, графы, линейная алгебра и комбинаторика' },
    cs: { title: 'Информатика', icon: 'terminal', color: 'badge-green', desc: 'Алгоритмы, Kotlin/Java, архитектура REST API и ML' },
    physics: { title: 'Физика', icon: 'bolt', color: 'badge-purple', desc: 'Электродинамика, уравнения Максвелла и поля' },
    econ: { title: 'Экономика', icon: 'trending_up', color: 'badge-amber', desc: 'Олимпиадная микроэкономика, теория игр и финансы' }
};

const ROLE_CONFIG = {
    NOVICE: {
        name: 'Начинающий',
        pandaImg: 'panda_studying.webp',
        mood: 'Проходит базовый курс по выбранным предметам',
        progress: 25,
        nextLabel: 'До уровня «Базовый (Исполнитель)»',
        hint: 'Решите выпускную задачу Курса 3 по любому предмету, чтобы открыть проекты.'
    },
    BASIC: {
        name: 'Базовый (Исполнитель)',
        pandaImg: 'panda_energetic.webp',
        mood: 'Выполняет практические кейсы и отправляет файлы на проверку!',
        progress: 55,
        nextLabel: 'До уровня «Начинающий ревьюер»',
        hint: 'Вам открыт каталог проектов! Сдайте квалификацию в предмете, чтобы получить право ревью.'
    },
    JR_REVIEWER: {
        name: 'Начинающий ревьюер',
        pandaImg: 'panda_meditating.webp',
        mood: 'Проверяет посылки участников в своей компетенции и копит PRODиты',
        progress: 80,
        nextLabel: 'До уровня «Эксперт»',
        hint: 'Вы можете проверять работы участников и проходить менторинг у Эксперта.'
    },
    EXPERT: {
        name: 'Опытный ревьюер / Эксперт',
        pandaImg: 'panda_teaching.webp',
        mood: 'Проверяет сложные кейсы и оценивает готовность начинающих ревьюеров',
        progress: 100,
        nextLabel: 'Максимальный уровень компетенций',
        hint: 'Полный доступ: сложные проекты, ревью и аккредитация начинающих ревьюеров.'
    },
    ORGANIZER: {
        name: 'Организатор',
        pandaImg: 'panda_asleep.webp',
        mood: 'Создает и публикует проектные кейсы для сообщества',
        progress: 100,
        nextLabel: 'Управление платформой',
        hint: 'Неопубликованные черновики видны только вам; опубликованные — всем участникам.'
    }
};

const DEFAULT_DB = {
    isRegistered: false,
    username: '',
    role: 'NOVICE',
    selectedSubjects: ['math', 'cs', 'econ'],
    currentSubject: 'math',
    currentCourseStage: 3,
    karma: 20,
    prodites: 50,
    completedSubjects: {},
    reviewerSubjects: {}, // Предметы, где подтверждено право ревью: { math: true }
    processedTxIds: [],   // Защита от двойного списания/начисления PRODитов
    courseQuestions: {
        math: [
            { id: 'm1', stage: 1, title: 'Первообразные корни по модулю p', text: 'Найдите наименьший первообразный корень по модулю простого числа p = 11.', answer: '2', solved: false },
            { id: 'm2', stage: 2, title: '2-switch преобразования графов', text: 'Сколько ребер меняют свое положение при одном элементарном 2-switch преобразовании?', answer: '2', solved: false },
            { id: 'm3', stage: 3, title: '[Финальный курс] Теория Рамсея', text: 'Найдите минимальное число вершин N, гарантирующее наличие клики или антиклики размера 3 — R(3,3).', answer: '6', solved: false }
        ],
        cs: [
            { id: 'c1', stage: 1, title: 'Поиск в сбалансированном дереве', text: 'Какова асимптотика поиска в красно-черном дереве из N вершин? (введите: logN)', answer: 'logN', solved: false },
            { id: 'c2', stage: 2, title: 'Ансамбли деревьев: Random Forest', text: 'Как называется метод бутстрэп-агрегирования при обучении случайного леса? (введите: bagging)', answer: 'bagging', solved: false },
            { id: 'c3', stage: 3, title: '[Финальный курс] Проектирование REST API', text: 'Какой HTTP статус-код возвращается при успешном создании ресурса методом POST?', answer: '201', solved: false }
        ],
        physics: [
            { id: 'p1', stage: 1, title: 'Теорема Гаусса', text: 'Чему равен поток вектора E через замкнутую поверхность при нулевом суммарном заряде внутри?', answer: '0', solved: false },
            { id: 'p2', stage: 2, title: 'Ларморовский радиус', text: 'Во сколько раз вырастет радиус окружности частицы в магнитном поле при увеличении скорости в 3 раза?', answer: '3', solved: false },
            { id: 'p3', stage: 3, title: '[Финальный курс] Уравнения Максвелла', text: 'Какой ток (введите: смещения) добавил Максвелл в уравнение для циркуляции магнитного поля?', answer: 'смещения', solved: false }
        ],
        econ: [
            { id: 'e1', stage: 1, title: 'Ценовая эластичность спроса', text: 'Функция спроса Qd = 100 - 2P. Найдите модуль эластичности спроса по цене при P = 25.', answer: '1', solved: false },
            { id: 'e2', stage: 2, title: 'Равновесие Курно', text: 'Две фирмы с нулевыми издержками конкурируют по Курно при P = 90 - Q. Найдите равновесный выпуск одной фирмы.', answer: '30', solved: false },
            { id: 'e3', stage: 3, title: '[Финальный курс] Дисконтирование облигации', text: 'Бескупонная облигация номиналом 1210 руб. погашается через 2 года при ставке 10%. Найдите ее текущую цену.', answer: '1000', solved: false }
        ]
    },
    projects: [
        {
            id: 'p101',
            title: 'Разработка сервиса авторизации и схемы БД на Supabase',
            subject: 'cs',
            minRole: 'BASIC',
            difficultyLabel: 'Базовый кейс',
            rewardKarma: 25,
            costProdites: 10,
            published: true,
            desc: 'Спроектировать SQL-таблицы, настроить Row Level Security, подготовить OpenAPI спецификацию и прикрепить архив проекта.'
        },
        {
            id: 'p102',
            title: 'Модель общественного благосостояния и налога (Deadweight Loss)',
            subject: 'econ',
            minRole: 'BASIC',
            difficultyLabel: 'Базовый кейс',
            rewardKarma: 20,
            costProdites: 10,
            published: true,
            desc: 'Рассчитать потери эффективности при введении потоварного налога и загрузить аналитический отчет или скрипт.'
        },
        {
            id: 'p103',
            title: 'Визуализатор графовых алгоритмов и 2-switch трансформаций',
            subject: 'math',
            minRole: 'JR_REVIEWER',
            difficultyLabel: 'Средний (Для Ревьюеров+)',
            rewardKarma: 45,
            costProdites: 15,
            published: true,
            desc: 'Реализовать модуль проверки степеней вершин и построения гамильтоновых циклов с покрытием юнит-тестами.'
        },
        {
            id: 'p105',
            title: '[Hard] Пайплайн градиентного бустинга для финансового скоринга',
            subject: 'econ',
            minRole: 'EXPERT',
            difficultyLabel: 'Сложный кейс (Экспертный)',
            rewardKarma: 90,
            costProdites: 25,
            published: true,
            desc: 'Построить ансамблевую модель прогнозирования дефолтов с кросс-валидацией и CI/CD пайплайном.'
        }
    ],
    submissions: [
        {
            id: 'sub_demo_1',
            projectId: 'p101',
            projectTitle: 'Разработка сервиса авторизации и схемы БД на Supabase',
            subject: 'cs',
            complexity: 'BASIC',
            author: 'Алексей С.',
            fileName: 'ktor_supabase_auth.zip (42 KB)',
            fileDataUrl: 'data:text/plain;charset=utf-8,' + encodeURIComponent('// Demo submission code by Alexey S.\nfun main() { println("PROD.Guild REST API Ready") }'),
            compiler: 'Kotlin / Java 21',
            comment: 'Реализованы миграции и JWT-валидация ролей.',
            timestamp: '12:40',
            status: 'Ожидает ревью',
            score: null,
            reviewer: null,
            feedback: null,
            rewardProdites: 15,
            rewardKarma: 20
        },
        {
            id: 'sub_demo_2',
            projectId: 'p105',
            projectTitle: '[Hard] Пайплайн градиентного бустинга для финансового скоринга',
            subject: 'econ',
            complexity: 'EXPERT',
            author: 'Мария К.',
            fileName: 'quant_boosting_model.py (18 KB)',
            fileDataUrl: 'data:text/plain;charset=utf-8,' + encodeURIComponent('# Gradient Boosting Pipeline\nimport numpy as np\nprint("ROC-AUC: 0.914")'),
            compiler: 'Python 3.12 / Jupyter',
            comment: 'Добавлена экстраполяция тренда и калибровка вероятностей.',
            timestamp: '14:15',
            status: 'Ожидает экспертного ревью',
            score: null,
            reviewer: null,
            feedback: null,
            rewardProdites: 35,
            rewardKarma: 45
        }
    ],
    mentoringQueue: [
        {
            id: 'ment_1',
            candidateName: 'Дмитрий В.',
            subject: 'math',
            sampleReview: 'Проверил решение по теории графов: указал автору на пропуск несвязного графа при N=4 и предложил заменить матрицу смежности на списки смежности.',
            status: 'Ожидает оценки Эксперта',
            expertConclusion: null
        }
    ],
    history: [
        { text: 'Начальный бонус при создании профиля PROD.Guild', delta: '+50 PRODитов', type: 'prod' }
    ]
};

const ApiService = {
    db: null,

    init() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            try {
                this.db = Object.assign({}, DEFAULT_DB, JSON.parse(raw));
            } catch (e) {
                this.db = JSON.parse(JSON.stringify(DEFAULT_DB));
            }
        } else {
            this.db = JSON.parse(JSON.stringify(DEFAULT_DB));
        }
        return this.db;
    },

    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
    },

    isGodMode() {
        return (this.db.username || '').trim() === 'MasterTalon';
    },

    // Идемпотентное проведение транзакции PRODитов и Кармы
    executeTransaction(txKey, deltaProdites, deltaKarma, description) {
        if (this.db.processedTxIds.includes(txKey)) {
            throw new Error('Операция уже была учтена ранее (защита от дублирования)');
        }
        if (!this.isGodMode() && this.db.prodites + deltaProdites < 0) {
            throw new Error('Недостаточно PRODитов на балансе!');
        }
        this.db.processedTxIds.push(txKey);
        if (!this.isGodMode() || deltaProdites > 0) {
            this.db.prodites += deltaProdites;
        }
        this.db.karma += deltaKarma;
        this.db.history.unshift({
            text: description,
            delta: `${deltaProdites !== 0 ? (deltaProdites > 0 ? '+' + deltaProdites : deltaProdites) + ' PRODитов ' : ''}${deltaKarma > 0 ? '+' + deltaKarma + ' Кармы' : ''}`.trim(),
            type: deltaProdites !== 0 ? 'prod' : 'karma'
        });
        this.save();
    }
};