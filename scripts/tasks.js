/**
 * Tasks page: state, modal, add task, render Due Today and groups.
 * Designed for easy extension (e.g. persistence, edit/delete, filters).
 */

(function () {
    'use strict';

    const MAX_TASKS_PER_GROUP = 100;

    /** @typedef {{ id: string, group: string, title: string, dueDate: string }} Task */

    /** @type {Task[]} */
    let tasks = [];

    const dom = {
        addTaskBtn: null,
        addTaskModal: null,
        modalBackdrop: null,
        addTaskForm: null,
        modalCancel: null,
        taskGroupInput: null,
        taskTitleInput: null,
        taskDueDateInput: null,
        taskGroups: null,
        dueTodayList: null,
        dueTodayMore: null
    };

    function getTodayDateString() {
        const d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function isDueToday(dueDateStr) {
        return dueDateStr === getTodayDateString();
    }

    function generateId() {
        return 'task-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
    }

    function cacheDOMElements() {
        dom.addTaskBtn = document.getElementById('addTaskBtn');
        dom.addTaskModal = document.getElementById('addTaskModal');
        dom.modalBackdrop = document.getElementById('modalBackdrop');
        dom.addTaskForm = document.getElementById('addTaskForm');
        dom.modalCancel = document.getElementById('modalCancel');
        dom.taskGroupInput = document.getElementById('taskGroup');
        dom.taskTitleInput = document.getElementById('taskTitle');
        dom.taskDueDateInput = document.getElementById('taskDueDate');
        dom.taskGroups = document.getElementById('taskGroups');
        dom.dueTodayList = document.querySelector('.due-today-list');
        dom.dueTodayMore = document.querySelector('.due-today-more');
    }

    function openModal() {
        if (!dom.addTaskModal) return;
        dom.addTaskModal.hidden = false;
        dom.addTaskBtn.setAttribute('aria-expanded', 'true');
        if (dom.taskDueDateInput) dom.taskDueDateInput.value = getTodayDateString();
        if (dom.taskTitleInput) dom.taskTitleInput.focus();
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        if (!dom.addTaskModal) return;
        dom.addTaskModal.hidden = true;
        dom.addTaskBtn.setAttribute('aria-expanded', 'false');
        if (dom.addTaskForm) dom.addTaskForm.reset();
        document.body.style.overflow = '';
    }

    function countTasksInGroup(groupName) {
        return tasks.filter(function (t) { return t.group.trim().toLowerCase() === groupName.trim().toLowerCase(); }).length;
    }

    function addTask(group, title, dueDate) {
        var groupTrimmed = group.trim();
        if (!groupTrimmed || !title.trim()) return null;
        if (countTasksInGroup(groupTrimmed) >= MAX_TASKS_PER_GROUP) return null;

        var task = {
            id: generateId(),
            group: groupTrimmed,
            title: title.trim(),
            dueDate: dueDate
        };
        tasks.push(task);
        return task;
    }

    function getGroups() {
        var seen = Object.create(null);
        tasks.forEach(function (t) {
            var g = t.group;
            if (!seen[g]) seen[g] = true;
        });
        return Object.keys(seen).sort();
    }

    function getTasksDueToday() {
        var today = getTodayDateString();
        return tasks.filter(function (t) { return t.dueDate === today; });
    }

    function renderDueToday() {
        if (!dom.dueTodayList) return;
        var dueToday = getTasksDueToday();
        dom.dueTodayList.textContent = '';
        dueToday.forEach(function (task) {
            var li = document.createElement('li');
            var pill = document.createElement('span');
            pill.className = 'task-pill task-pill--due-today';
            pill.textContent = task.title;
            pill.setAttribute('data-task-id', task.id);
            li.appendChild(pill);
            dom.dueTodayList.appendChild(li);
        });
        if (dom.dueTodayMore) {
            if (dueToday.length > 0) {
                dom.dueTodayMore.hidden = false;
                dom.dueTodayMore.textContent = '';
            } else {
                dom.dueTodayMore.hidden = true;
            }
        }
    }

    function renderGroups() {
        if (!dom.taskGroups) return;
        var groups = getGroups();
        dom.taskGroups.textContent = '';
        groups.forEach(function (groupName) {
            var groupTasks = tasks.filter(function (t) { return t.group === groupName; });
            var card = document.createElement('div');
            card.className = 'task-group';
            card.setAttribute('data-group', groupName);
            var titleEl = document.createElement('h3');
            titleEl.className = 'task-group-title';
            titleEl.textContent = groupName;
            var list = document.createElement('ul');
            list.className = 'task-group-list';
            list.setAttribute('aria-label', 'Tasks in ' + groupName);
            groupTasks.forEach(function (task) {
                var li = document.createElement('li');
                var pill = document.createElement('span');
                pill.className = 'task-pill';
                pill.textContent = task.title;
                pill.setAttribute('data-task-id', task.id);
                li.appendChild(pill);
                list.appendChild(li);
            });
            card.appendChild(titleEl);
            card.appendChild(list);
            dom.taskGroups.appendChild(card);
        });
    }

    function render() {
        renderDueToday();
        renderGroups();
    }

    function handleAddTaskSubmit(e) {
        e.preventDefault();
        var group = dom.taskGroupInput && dom.taskGroupInput.value;
        var title = dom.taskTitleInput && dom.taskTitleInput.value;
        var dueDate = dom.taskDueDateInput && dom.taskDueDateInput.value;
        if (!group || !title || !dueDate) return;

        if (countTasksInGroup(group) >= MAX_TASKS_PER_GROUP) {
            alert('This group already has the maximum of ' + MAX_TASKS_PER_GROUP + ' tasks.');
            return;
        }

        var task = addTask(group, title, dueDate);
        if (task) {
            closeModal();
            render();
        }
    }

    function setupEventListeners() {
        if (dom.addTaskBtn) dom.addTaskBtn.addEventListener('click', openModal);
        if (dom.modalBackdrop) dom.modalBackdrop.addEventListener('click', closeModal);
        if (dom.modalCancel) dom.modalCancel.addEventListener('click', closeModal);
        if (dom.addTaskForm) dom.addTaskForm.addEventListener('submit', handleAddTaskSubmit);

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && dom.addTaskModal && !dom.addTaskModal.hidden) closeModal();
        });
    }

    function init() {
        cacheDOMElements();
        if (dom.taskDueDateInput) dom.taskDueDateInput.value = getTodayDateString();
        setupEventListeners();
        render();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
