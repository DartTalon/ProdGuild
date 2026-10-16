const App = {
    activeProjectId: null,
    selectedFileObj: null,
    selectedFileDataUrl: null,

    init() {
        ApiService.init();
        if (!ApiService.db.isRegistered) {
            this.showSection('page-register');
        } else {
            this.updateGlobalUI();
            this.navigate('profile');
        }
    },

    toggleSubjCard(el) {
        el.classList.toggle('selected');
    },

    completeRegistration() {
        const nameVal = document.getElementById('reg-name').value.trim();
        if (!nameVal) return this.toast('Введите ваш никнейм!');

        const cards = document.querySelectorAll('#reg-subjects-box .subject-check-card.selected');
        if (cards.length === 0) return this.toast('Выберите хотя бы один профильный предмет!');

        const db = ApiService.db;
        db.username = nameVal;
        db.selectedSubjects = Array.from(cards).map(c => c.getAttribute('data-subj'));
        db.currentSubject = db.selectedSubjects[0];
        db.currentCourseStage = parseInt(document.getElementById('reg-course-level').value, 10);
        db.isRegistered = true;

        if (ApiService.isGodMode()) {
            db.role = 'EXPERT';
            db.reviewerSubjects = { math: true, cs: true, physics: true, econ: true };
            this.toast('⚡ Активирован Режим Бога (MasterTalon)! Открыты все уровни и панели.');
        } else {
            db.role = 'NOVICE';
            this.toast(`Профиль создан! Ваш стартовый уровень — «Начинающий».`);
        }

        ApiService.save();
        this.updateGlobalUI();
        this.navigate('profile');
    },

    toggleEditProfile() {
        const box = document.getElementById('profile-edit-card');
        box.classList.toggle('hidden');
        if (!box.classList.contains('hidden')) {
            const db = ApiService.db;
            document.getElementById('edit-name').value = db.username;
            document.getElementById('edit-course-level').value = String(db.currentCourseStage);
            document.querySelectorAll('#edit-subjects-box .subject-check-card').forEach(el => {
                const s = el.getAttribute('data-subj');
                el.classList.toggle('selected', db.selectedSubjects.includes(s));
            });
        }
    },

    saveProfileChanges() {
        const newName = document.getElementById('edit-name').value.trim();
        const cards = document.querySelectorAll('#edit-subjects-box .subject-check-card.selected');
        if (!newName || cards.length === 0) {
            return this.toast('Укажите никнейм и выберите хотя бы один предмет!');
        }

        const db = ApiService.db;
        const wasGod = ApiService.isGodMode();
        db.username = newName;
        db.selectedSubjects = Array.from(cards).map(c => c.getAttribute('data-subj'));
        db.currentCourseStage = parseInt(document.getElementById('edit-course-level').value, 10);

        if (ApiService.isGodMode() && !wasGod) {
            db.role = 'EXPERT';
            db.reviewerSubjects = { math: true, cs: true, physics: true, econ: true };
            this.toast('⚡ Включен режим Бога (MasterTalon)!');
        } else if (!ApiService.isGodMode() && wasGod) {
            db.role = Object.keys(db.completedSubjects).length > 0 ? 'BASIC' : 'NOVICE';
            this.toast('Включен стандартный пользовательский режим.');
        } else {
            this.toast('Настройки профиля сохранены!');
        }

        document.getElementById('profile-edit-card').classList.add('hidden');
        ApiService.save();
        this.updateGlobalUI();
        this.renderProfilePage();
    },

    resetFullAccount() {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    },

    setGodRole(roleKey) {
        if (!ApiService.isGodMode()) return;
        ApiService.db.role = roleKey;
        ApiService.save();
        this.updateGlobalUI();
        const activeSec = document.querySelector('.page-section:not(.hidden)');
        if (activeSec) this.navigate(activeSec.id.replace('page-', ''));
        this.toast(`MasterTalon: переключен вид на «${ROLE_CONFIG[roleKey].name}»`);
    },

    giveGodResources() {
        if (!ApiService.isGodMode()) return;
        ApiService.executeTransaction('god_' + Date.now(), 100, 100, 'Бонус режима MasterTalon');
        this.updateGlobalUI();
        this.renderProfilePage();
        this.toast('⚡ Начислено +100 PRODитов и +100 Кармы!');
    },

    updateGlobalUI() {
        const db = ApiService.db;
        const god = ApiService.isGodMode();
        document.getElementById('main-navbar').classList.toggle('hidden', !db.isRegistered);
        document.getElementById('god-mode-bar').classList.toggle('hidden', !db.isRegistered || !god);

        if (god) {
            document.querySelectorAll('.god-chip').forEach(c => c.classList.remove('active'));
            const chip = document.getElementById('god-' + db.role);
            if (chip) chip.classList.add('active');
        }

        const cfg = ROLE_CONFIG[db.role] || ROLE_CONFIG.NOVICE;
        document.getElementById('nav-role-badge').textContent = god ? `⚡ ${cfg.name}` : cfg.name;
        document.getElementById('header-username').textContent = db.username;
        document.getElementById('header-karma').textContent = db.karma;
        document.getElementById('header-prodites').textContent = db.prodites;
        document.getElementById('header-avatar').src = cfg.pandaImg;

        const unlockedProjects = god || db.role !== 'NOVICE';
        const hasAnyReviewRight = god || Object.keys(db.reviewerSubjects).length > 0 || db.role === 'JR_REVIEWER' || db.role === 'EXPERT';
        const isOrg = god || db.role === 'ORGANIZER';

        document.getElementById('lock-projects').classList.toggle('hidden', unlockedProjects);
        document.getElementById('lock-my-projects').classList.toggle('hidden', unlockedProjects);
        document.getElementById('lock-review').classList.toggle('hidden', hasAnyReviewRight);
        document.getElementById('tab-organizer').classList.toggle('hidden', !isOrg);
    },

    showSection(secId) {
        document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
        document.getElementById(secId).classList.remove('hidden');
    },

    navigate(pageKey) {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        const tab = document.getElementById('tab-' + pageKey);
        if (tab) tab.classList.add('active');

        if (pageKey === 'profile') { this.renderProfilePage(); this.showSection('page-profile'); }
        else if (pageKey === 'subject') { this.renderSubjectPage(); this.showSection('page-subject'); }
        else if (pageKey === 'tasks') { this.renderAllSubjectsPage(); this.showSection('page-tasks'); }
        else if (pageKey === 'projects') { this.renderProjectsPage(); this.showSection('page-projects'); }
        else if (pageKey === 'my-projects') { this.renderMyProjectsPage(); this.showSection('page-my-projects'); }
        else if (pageKey === 'review') { this.renderReviewPage(); this.showSection('page-review'); }
        else if (pageKey === 'organizer') { this.renderOrganizerPage(); this.showSection('page-organizer'); }
    },

    // ПРОФИЛЬ
    renderProfilePage() {
        const db = ApiService.db;
        const god = ApiService.isGodMode();
        const cfg = ROLE_CONFIG[db.role] || ROLE_CONFIG.NOVICE;

        document.getElementById('profile-panda-img').src = cfg.pandaImg;
        document.getElementById('profile-role-badge').textContent = god ? '⚡ GOD MODE (MasterTalon)' : cfg.name;
        document.getElementById('profile-name').textContent = db.username;
        document.getElementById('profile-panda-mood').textContent = cfg.mood;
        document.getElementById('profile-progress-bar').style.width = (god ? 100 : cfg.progress) + '%';
        document.getElementById('profile-next-step-label').textContent = cfg.nextLabel;
        document.getElementById('profile-access-hint').textContent = cfg.hint;

        const grid = document.getElementById('profile-subjects-grid');
        grid.innerHTML = '';
        db.selectedSubjects.forEach(subjKey => {
            const meta = SUBJECTS_META[subjKey];
            const courseDone = !!db.completedSubjects[subjKey];
            const canRevSubj = god || !!db.reviewerSubjects[subjKey];

            grid.innerHTML += `
                <div class="card">
                    <div>
                        <div class="card-header">
                            <span class="badge ${meta.color}">${meta.title}</span>
                            <span class="badge ${canRevSubj ? 'badge-purple' : (courseDone ? 'badge-green' : 'badge-amber')}">
                                ${canRevSubj ? 'Право ревью ✓' : (courseDone ? 'Базовый курс пройден ✓' : 'Курс ' + db.currentCourseStage + '/3')}
                            </span>
                        </div>
                        <h4 class="card-title mb-10">${meta.title}</h4>
                        <p class="card-desc">${meta.desc}</p>
                    </div>
                    <button class="g-btn g-btn-tonal" onclick="App.openSubjectCourse('${subjKey}')">
                        <span class="material-symbols-rounded">play_arrow</span> Открыть страницу предмета
                    </button>
                </div>
            `;
        });

        document.getElementById('profile-history-list').innerHTML = db.history.map(h => `
            <div class="history-item">
                <span>${h.text}</span>
                <span class="badge ${h.type === 'prod' ? 'badge-amber' : 'badge-blue'}">${h.delta}</span>
            </div>
        `).join('');
    },

    openFirstSelectedSubject() {
        this.openSubjectCourse(ApiService.db.selectedSubjects[0] || 'math');
    },

    openSubjectCourse(subjKey) {
        ApiService.db.currentSubject = subjKey;
        ApiService.save();
        this.navigate('subject');
    },

    setCourseStage(stageNum) {
        ApiService.db.currentCourseStage = stageNum;
        ApiService.save();
        this.renderSubjectPage();
    },

    // СТРАНИЦА ПРЕДМЕТА И РЕШЕНИЕ ЗАДАЧ
    renderSubjectPage() {
        const db = ApiService.db;
        const subjKey = db.currentSubject;
        const meta = SUBJECTS_META[subjKey];

        document.getElementById('subj-page-title').textContent = `${meta.title} — Курс ${db.currentCourseStage}`;
        [1, 2, 3].forEach(n => {
            document.getElementById('stage-btn-' + n).className =
                (n === db.currentCourseStage) ? 'g-btn g-btn-filled' : 'g-btn g-btn-outlined';
        });

        // Показываем баннер получения права ревью, если курс по предмету уже пройден, а права ревью еще нет
        const examBox = document.getElementById('subject-reviewer-exam-box');
        const showExam = db.completedSubjects[subjKey] && !db.reviewerSubjects[subjKey];
        examBox.classList.toggle('hidden', !showExam);

        const list = db.courseQuestions[subjKey] || [];
        const grid = document.getElementById('subject-questions-grid');
        grid.innerHTML = '';

        list.forEach(q => {
            const isFinal = q.stage === 3;
            grid.innerHTML += `
                <div class="card">
                    <div>
                        <div class="card-header">
                            <span class="badge ${isFinal ? 'badge-amber' : 'badge-blue'}">Курс ${q.stage} ${isFinal ? '• Выпускная задача' : ''}</span>
                            ${q.solved ? '<span class="badge badge-green">Решено ✓</span>' : ''}
                        </div>
                        <h3 class="card-title mb-10">${q.title}</h3>
                        <p class="card-desc">${q.text}</p>
                        <div class="form-group">
                            <input type="text" id="ans-${q.id}" class="form-input" placeholder="Введите ответ (верно: ${q.answer})" value="${q.solved ? q.answer : ''}">
                        </div>
                    </div>
                    <div class="card-footer">
                        <span class="muted-small">Награда: +15 Кармы</span>
                        <button class="g-btn g-btn-filled" onclick="App.checkTaskAnswer('${subjKey}', '${q.id}', '${q.answer}', ${q.stage})">
                            <span class="material-symbols-rounded">check_circle</span> Проверить
                        </button>
                    </div>
                </div>
            `;
        });
    },

    checkTaskAnswer(subjKey, qId, expected, stage) {
        const inputVal = document.getElementById('ans-' + qId).value.trim().toLowerCase();
        if (inputVal !== expected.toLowerCase()) {
            return this.toast(`Ответ неверный! Подсказка для проверки: ${expected}`);
        }

        const db = ApiService.db;
        const q = db.courseQuestions[subjKey].find(x => x.id === qId);
        if (q && !q.solved) {
            q.solved = true;
            ApiService.executeTransaction(`task_${qId}`, 0, 15, `Решена задача курса «${q.title}» (${SUBJECTS_META[subjKey].title})`);
        }

        if (stage === 3) {
            db.completedSubjects[subjKey] = true;
            if (db.role === 'NOVICE') {
                db.role = 'BASIC';
                ApiService.executeTransaction(`grad_${subjKey}`, 0, 25, `Окончен финальный курс (${SUBJECTS_META[subjKey].title}) — Открыт уровень «Базовый» и Проекты!`);
                this.toast('Поздравляем! Вы прошли финальный курс, получили уровень «Базовый» и открыли раздел «Проекты»!');
            } else {
                this.toast(`Курс по предмету «${SUBJECTS_META[subjKey].title}» пройден! Теперь доступна квалификация ревьюера.`);
            }
        } else {
            this.toast('Задача решена верно! Начислено +15 Кармы.');
        }

        ApiService.save();
        this.updateGlobalUI();
        this.renderSubjectPage();
    },

    openReviewerQualificationModal() {
        const subjTitle = SUBJECTS_META[ApiService.db.currentSubject].title;
        document.getElementById('qual-modal-title').textContent = `Квалификация на право ревью: ${subjTitle}`;
        document.getElementById('qual-review-text').value = '';
        document.getElementById('qualification-modal').classList.remove('hidden');
    },

    submitReviewerQualification() {
        const reviewText = document.getElementById('qual-review-text').value.trim();
        if (reviewText.length < 10) {
            return this.toast('Напишите содержательное тестовое ревью (минимум 10 символов)!');
        }
        const db = ApiService.db;
        const subjKey = db.currentSubject;
        db.reviewerSubjects[subjKey] = true;
        if (db.role === 'BASIC' || db.role === 'NOVICE') {
            db.role = 'JR_REVIEWER';
        }

        // Сохраняем заявку в очередь менторинга для Эксперта
        db.mentoringQueue.unshift({
            id: 'ment_' + Date.now(),
            candidateName: db.username,
            subject: subjKey,
            sampleReview: reviewText,
            status: 'Ожидает оценки Эксперта',
            expertConclusion: null
        });

        ApiService.executeTransaction(`qual_${subjKey}_${Date.now()}`, 0, 20, `Подтверждено право ревью в области «${SUBJECTS_META[subjKey].title}»`);
        this.closeModal('qualification-modal');
        this.updateGlobalUI();
        this.renderSubjectPage();
        this.toast(`Право ревью по предмету «${SUBJECTS_META[subjKey].title}» получено!`);
    },

    renderAllSubjectsPage() {
        const box = document.getElementById('all-subjects-overview');
        box.innerHTML = '';
        Object.keys(SUBJECTS_META).forEach(k => {
            const m = SUBJECTS_META[k];
            box.innerHTML += `
                <div class="card">
                    <div>
                        <span class="badge ${m.color}">${m.title}</span>
                        <h3 class="card-title mt-6 mb-10">Курс и тренажер задач: ${m.title}</h3>
                        <p class="card-desc">${m.desc}</p>
                    </div>
                    <button class="g-btn g-btn-filled" onclick="App.openSubjectCourse('${k}')">Перейти к задачам</button>
                </div>
            `;
        });
    },

    // КАТАЛОГ ПРОЕКТОВ И ОТПРАВКА ПОСЫЛКИ
    renderProjectsPage() {
        const db = ApiService.db;
        const god = ApiService.isGodMode();
        const unlocked = god || db.role !== 'NOVICE';

        document.getElementById('projects-locked-view').classList.toggle('hidden', unlocked);
        const grid = document.getElementById('projects-cards-grid');
        if (!unlocked) { grid.innerHTML = ''; return; }

        const rankMap = { NOVICE: 0, BASIC: 1, JR_REVIEWER: 2, EXPERT: 3, ORGANIZER: 4 };
        const userRank = god ? 99 : rankMap[db.role];

        // Обычные участники видят ТОЛЬКО опубликованные кейсы
        const visibleProjects = db.projects.filter(p => p.published || god || db.role === 'ORGANIZER');

        grid.innerHTML = visibleProjects.map(p => {
            const m = SUBJECTS_META[p.subject];
            const canTake = userRank >= rankMap[p.minRole];
            return `
                <div class="card">
                    <div>
                        <div class="card-header">
                            <span class="badge ${m.color}">${m.title}</span>
                            <span class="badge ${p.published ? 'badge-purple' : 'badge-red'}">
                                ${p.published ? p.difficultyLabel : 'Черновик (Скрыт)'}
                            </span>
                        </div>
                        <h3 class="card-title mb-10">${p.title}</h3>
                        <p class="card-desc">${p.desc}</p>
                    </div>
                    <div>
                        <div class="flex-between muted-small mb-10">
                            <span>Награда: <strong>+${p.rewardKarma} Кармы</strong></span>
                            <span>Ревью: <strong>${p.costProdites} PRODитов</strong></span>
                        </div>
                        <button class="g-btn ${canTake ? 'g-btn-filled' : 'g-btn-outlined'} full-width-btn" ${!canTake ? 'disabled' : ''} onclick="App.openSubmissionModal('${p.id}')">
                            <span class="material-symbols-rounded">${canTake ? 'upload_file' : 'lock'}</span>
                            ${canTake ? 'Сдать проект (Отправить файл)' : 'Требуется уровень выше'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    openSubmissionModal(projId) {
        const proj = ApiService.db.projects.find(p => p.id === projId);
        if (!proj) return;
        this.activeProjectId = projId;
        this.selectedFileObj = null;
        this.selectedFileDataUrl = null;

        document.getElementById('modal-proj-title').textContent = proj.title;
        document.getElementById('modal-cost-label').textContent = `${proj.costProdites} PRODитов`;
        document.getElementById('modal-file-input').value = '';
        document.getElementById('modal-file-label').textContent = 'Нажмите, чтобы выбрать файл решения';
        document.getElementById('modal-dropzone').classList.remove('has-file');
        document.getElementById('modal-comment').value = '';
        document.getElementById('submission-modal').classList.remove('hidden');
    },

    handleContestFileSelect(inputEl) {
        if (inputEl.files && inputEl.files.length > 0) {
            const file = inputEl.files[0];
            this.selectedFileObj = file;
            const sizeKB = Math.max(1, Math.round(file.size / 1024));
            document.getElementById('modal-file-label').textContent = `Файл готов: ${file.name} (${sizeKB} KB)`;
            document.getElementById('modal-dropzone').classList.add('has-file');

            const reader = new FileReader();
            reader.onload = (e) => { this.selectedFileDataUrl = e.target.result; };
            reader.readAsDataURL(file);
        }
    },

    submitContestSolution() {
        const db = ApiService.db;
        const proj = db.projects.find(p => p.id === this.activeProjectId);
        if (!proj) return;
        if (!this.selectedFileObj) {
            return this.toast('Прикрепите файл выполненного проекта перед отправкой!');
        }

        const txId = `submit_${proj.id}_${Date.now()}`;
        try {
            ApiService.executeTransaction(txId, -proj.costProdites, 0, `Отправка решения по кейсу «${proj.title}»`);
        } catch (err) {
            return this.toast(err.message);
        }

        const sizeKB = Math.max(1, Math.round(this.selectedFileObj.size / 1024));
        const newSub = {
            id: 'sub_' + Date.now(),
            projectId: proj.id,
            projectTitle: proj.title,
            subject: proj.subject,
            complexity: proj.minRole === 'EXPERT' ? 'EXPERT' : 'BASIC',
            author: db.username,
            fileName: `${this.selectedFileObj.name} (${sizeKB} KB)`,
            rawFileName: this.selectedFileObj.name,
            fileDataUrl: this.selectedFileDataUrl || 'data:text/plain;charset=utf-8,SubmittedFile',
            compiler: document.getElementById('modal-compiler').value,
            comment: document.getElementById('modal-comment').value.trim() || 'Без комментария',
            timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            status: 'Ожидает ревью',
            score: null,
            reviewer: null,
            feedback: null,
            rewardProdites: proj.costProdites + 5,
            rewardKarma: proj.rewardKarma
        };

        db.submissions.unshift(newSub);
        ApiService.save();
        this.closeModal('submission-modal');
        this.updateGlobalUI();
        this.navigate('my-projects');
        this.toast(`Посылка «${this.selectedFileObj.name}» сохранена и передана на ревью!`);
    },

    // МОИ ПРОЕКТЫ
    renderMyProjectsPage() {
        const db = ApiService.db;
        const god = ApiService.isGodMode();
        const unlocked = god || db.role !== 'NOVICE';
        document.getElementById('my-projects-locked-view').classList.toggle('hidden', unlocked);
        const list = document.getElementById('my-projects-list');
        if (!unlocked) { list.innerHTML = ''; return; }

        const mySubs = db.submissions.filter(s => s.author === db.username || god);
        if (mySubs.length === 0) {
            list.innerHTML = `<div class="card"><p class="card-desc">У вас пока нет отправленных решений. Выберите кейс во вкладке «Проекты» и загрузите файл!</p></div>`;
            return;
        }

        list.innerHTML = mySubs.map(s => `
            <div class="card">
                <div>
                    <div class="card-header">
                        <span class="badge ${s.score ? 'badge-green' : 'badge-blue'}">
                            ${s.score ? `Проверено • Оценка: ${s.score}/10` : s.status}
                        </span>
                        <span class="muted-small">Автор: ${s.author} • ${s.timestamp}</span>
                    </div>
                    <h3 class="card-title mb-10">${s.projectTitle}</h3>
                    <p class="muted-small mb-10">
                        <strong>Файл:</strong> ${s.fileName} •
                        <a href="${s.fileDataUrl}" download="${s.rawFileName || 'solution.txt'}" style="color:var(--md-secondary); font-weight:700;">Скачать отправленный файл</a>
                    </p>
                    <p class="muted-small mb-14"><strong>Среда:</strong> ${s.compiler} • <strong>Комментарий:</strong> ${s.comment}</p>
                    <div class="progress-box">
                        <strong>Обратная связь ревьюера ${s.reviewer ? `(${s.reviewer})` : ''}:</strong><br>
                        <span class="muted-small">${s.feedback || 'Работа находится в очереди на проверку у компетентного ревьюера.'}</span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    // РЕВЬЮ ПРОЕКТОВ И МЕНТОРИНГ
    renderReviewPage() {
        const db = ApiService.db;
        const god = ApiService.isGodMode();
        const hasReviewRight = god || Object.keys(db.reviewerSubjects).length > 0 || db.role === 'JR_REVIEWER' || db.role === 'EXPERT';

        document.getElementById('review-locked-view').classList.toggle('hidden', hasReviewRight);
        document.getElementById('review-active-view').classList.toggle('hidden', !hasReviewRight);
        if (!hasReviewRight) return;

        const isExpert = god || db.role === 'EXPERT';
        document.getElementById('expert-mentoring-block').classList.toggle('hidden', !isExpert);

        const qGrid = document.getElementById('review-queue-grid');
        const pendingSubs = db.submissions.filter(s => s.score === null);

        if (pendingSubs.length === 0) {
            qGrid.innerHTML = `<div class="card"><p class="card-desc">Все текущие посылки проверены!</p></div>`;
        } else {
            qGrid.innerHTML = pendingSubs.map(item => {
                const m = SUBJECTS_META[item.subject];
                const isOwnWork = item.author === db.username && !god;
                const hasSubjCompetence = god || !!db.reviewerSubjects[item.subject] || db.role === 'EXPERT' || db.role === 'JR_REVIEWER';
                const lockedComplexity = item.complexity === 'EXPERT' && !isExpert;
                const canCheck = !isOwnWork && hasSubjCompetence && !lockedComplexity;

                let lockReason = '';
                if (isOwnWork) lockReason = 'Нельзя проверять собственную работу';
                else if (!hasSubjCompetence) lockReason = `Нет права ревью по предмету «${m.title}»`;
                else if (lockedComplexity) lockReason = 'Сложный кейс (Только для Экспертов)';

                return `
                    <div class="card">
                        <div>
                            <div class="card-header">
                                <span class="badge ${m.color}">${m.title}</span>
                                <span class="badge badge-green">+${item.rewardProdites} PRODитов / +${item.rewardKarma} Кармы</span>
                            </div>
                            <h3 class="card-title mb-10">${item.projectTitle}</h3>
                            <p class="muted-small mb-10">
                                Автор: <strong>${item.author}</strong> • Посылка: <code>${item.fileName}</code>
                                <a href="${item.fileDataUrl}" download="${item.rawFileName || 'submission.txt'}" style="color:var(--md-secondary); font-weight:700; margin-left:6px;">[Скачать файл]</a>
                            </p>
                            <div class="form-group">
                                <label class="form-label">Оценка решения (1–10):</label>
                                <select id="rev-score-${item.id}" class="form-select" ${!canCheck ? 'disabled' : ''}>
                                    <option value="10">10 / 10 — Безупречное решение</option>
                                    <option value="9">9 / 10 — Отлично, минорные замечания</option>
                                    <option value="8">8 / 10 — Хорошо, есть точки роста</option>
                                    <option value="6">6 / 10 — Требуется доработка</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Содержательная обратная связь автору *:</label>
                                <textarea id="rev-fb-${item.id}" class="form-textarea" rows="2" placeholder="Укажите ошибки и точки улучшения..." ${!canCheck ? 'disabled' : ''}></textarea>
                            </div>
                        </div>
                        <button class="g-btn ${canCheck ? 'g-btn-blue' : 'g-btn-outlined'}" ${!canCheck ? 'disabled' : ''} onclick="App.completeReview('${item.id}')">
                            <span class="material-symbols-rounded">task_alt</span>
                            ${canCheck ? 'Завершить ревью и начислить PRODиты' : lockReason}
                        </button>
                    </div>
                `;
            }).join('');
        }

        // Очередь менторинга для Эксперта
        if (isExpert) {
            const mGrid = document.getElementById('mentoring-candidates-grid');
            mGrid.innerHTML = db.mentoringQueue.map(cand => {
                const m = SUBJECTS_META[cand.subject];
                const isDone = !!cand.expertConclusion;
                return `
                    <div class="card">
                        <div>
                            <div class="card-header">
                                <span class="badge ${m.color}">${m.title}</span>
                                <span class="badge ${isDone ? 'badge-green' : 'badge-purple'}">${cand.status}</span>
                            </div>
                            <h3 class="card-title mb-10">Кандидат: ${cand.candidateName}</h3>
                            <p class="card-desc"><strong>Пробное ревью кандидата:</strong> «${cand.sampleReview}»</p>
                            <div class="form-group">
                                <label class="form-label">Заключение Эксперта и обучающий разбор *:</label>
                                <textarea id="ment-fb-${cand.id}" class="form-textarea" rows="2" placeholder="Напишите разбор для начинающего ревьюера..." ${isDone ? 'disabled' : ''}>${cand.expertConclusion || ''}</textarea>
                            </div>
                        </div>
                        <button class="g-btn ${isDone ? 'g-btn-tonal' : 'g-btn-filled'}" ${isDone ? 'disabled' : ''} onclick="App.approveMentoring('${cand.id}')">
                            <span class="material-symbols-rounded">verified_user</span>
                            ${isDone ? 'Заключение сохранено ✓' : 'Утвердить готовность ревьюера (+20 PRODитов)'}
                        </button>
                    </div>
                `;
            }).join('');
        }
    },

    completeReview(subId) {
        const db = ApiService.db;
        const sub = db.submissions.find(s => s.id === subId);
        if (!sub) return;

        if (sub.author === db.username && !ApiService.isGodMode()) {
            return this.toast('Ошибка доступа: проверять собственную работу запрещено!');
        }

        const fb = document.getElementById('rev-fb-' + subId).value.trim();
        const score = parseInt(document.getElementById('rev-score-' + subId).value, 10);
        if (fb.length < 5) {
            return this.toast('Напишите содержательную обратную связь (минимум 5 символов)!');
        }

        sub.score = score;
        sub.feedback = fb;
        sub.reviewer = db.username;
        sub.status = `Проверено (${score}/10)`;

        ApiService.executeTransaction(
            `rev_reward_${subId}`,
            sub.rewardProdites,
            sub.rewardKarma,
            `Выполнено ревью проекта «${sub.projectTitle}» (автор: ${sub.author})`
        );

        this.updateGlobalUI();
        this.renderReviewPage();
        this.toast(`Ревью сохранено! Начислено +${sub.rewardProdites} PRODитов и +${sub.rewardKarma} Кармы.`);
    },

    approveMentoring(mentId) {
        const db = ApiService.db;
        const item = db.mentoringQueue.find(m => m.id === mentId);
        if (!item) return;

        const conclusion = document.getElementById('ment-fb-' + mentId).value.trim();
        if (conclusion.length < 5) {
            return this.toast('Оставьте содержательное заключение эксперта!');
        }

        item.expertConclusion = conclusion;
        item.status = `Аттестован Экспертом (${db.username})`;

        // Если эксперт оценивает начинающего ревьюера, повышаем уровень до Эксперта
        if (db.role === 'JR_REVIEWER') db.role = 'EXPERT';

        ApiService.executeTransaction(
            `ment_reward_${mentId}`,
            20,
            30,
            `Экспертная оценка начинающего ревьюера (${item.candidateName})`
        );

        this.updateGlobalUI();
        this.renderReviewPage();
        this.toast('Заключение эксперта сохранено! Начислено +20 PRODитов и +30 Кармы.');
    },

    // ОРГАНИЗАТОР
    renderOrganizerPage() {
        const list = document.getElementById('organizer-cases-list');
        list.innerHTML = ApiService.db.projects.map(p => `
            <div class="history-item">
                <div>
                    <strong>${p.title}</strong>
                    <div class="muted-small">${SUBJECTS_META[p.subject].title} • ${p.difficultyLabel}</div>
                </div>
                <div class="flex-gap">
                    <span class="badge ${p.published ? 'badge-green' : 'badge-amber'}">${p.published ? 'Опубликован' : 'Черновик'}</span>
                    ${!p.published ? `<button class="g-btn g-btn-filled btn-sm" onclick="App.publishDraftCase('${p.id}')">Опубликовать</button>` : ''}
                </div>
            </div>
        `).join('');
    },

    createOrganizerCase(publishImmediately) {
        const title = document.getElementById('org-proj-title').value.trim();
        const subj = document.getElementById('org-proj-subj').value;
        const minRole = document.getElementById('org-proj-level').value;
        const desc = document.getElementById('org-proj-desc').value.trim();

        if (!title || !desc) {
            return this.toast('Для создания кейса обязательны название, область и описание!');
        }

        ApiService.db.projects.unshift({
            id: 'p_' + Date.now(),
            title,
            subject: subj,
            minRole,
            difficultyLabel: minRole === 'EXPERT' ? 'Сложный кейс (Экспертный)' : (minRole === 'JR_REVIEWER' ? 'Средний кейс' : 'Базовый кейс'),
            rewardKarma: minRole === 'EXPERT' ? 80 : 35,
            costProdites: minRole === 'EXPERT' ? 20 : 10,
            published: publishImmediately,
            desc
        });

        ApiService.save();
        document.getElementById('org-proj-title').value = '';
        document.getElementById('org-proj-desc').value = '';
        this.renderOrganizerPage();
        this.toast(publishImmediately ? 'Кейс опубликован в каталог!' : 'Кейс сохранен как черновик (скрыт от обычных участников).');
    },

    publishDraftCase(projId) {
        const p = ApiService.db.projects.find(x => x.id === projId);
        if (p) {
            p.published = true;
            ApiService.save();
            this.renderOrganizerPage();
            this.toast(`Кейс «${p.title}» опубликован и теперь виден участникам!`);
        }
    },

    closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    },

    closeModalOnBg(e, modalId) {
        if (e.target.id === modalId) this.closeModal(modalId);
    },

    toast(msg) {
        const box = document.getElementById('toast-container');
        const el = document.createElement('div');
        el.className = 'toast-msg';
        el.innerHTML = `<span class="material-symbols-rounded" style="color:#4ade80;">check_circle</span><span>${msg}</span>`;
        box.appendChild(el);
        setTimeout(() => el.remove(), 3600);
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());