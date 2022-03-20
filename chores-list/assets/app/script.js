class DOMHelper {
  static clearEventListeners(element) {
    const clonedElement = element.cloneNode(true);
    element.replaceWith(clonedElement);
    return clonedElement;
  }

  static moveElement(elementId, newDestination) {
    const element = document.getElementById(elementId);
    const destinationElement = document.querySelector(newDestination);
    destinationElement.append(element);
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

class Component {
  constructor(hostElementId, insertBefore = false) {
    if (hostElementId) {
      this.hostElement = document.getElementById(hostElementId);
    } else {
      this.hostElement = document.body;
    }
    this.insertBefore = insertBefore;
  }

  detach() {
    if (this.element) {
      this.element.remove();
    }
  }

  attach() {
    this.hostElement.insertAdjacentElement(
      this.insertBefore ? 'afterbegin' : 'beforeend',
      this.element
    );
  }
}

class Tooltip extends Component {
  constructor(closeNotifier, text, hostElementId) {
    super(hostElementId);
    this.closeNotifier = closeNotifier;
    this.text = text;
    this.create();
  }

  closeTooltip = () => {
    this.detach();
    this.closeNotifier();
  };

  create() {
    const tooltipElement = document.createElement('div');
    tooltipElement.className = 'card';
    const tooltipTemplate = document.getElementById('tooltip');
    const tooltipBody = document.importNode(tooltipTemplate.content, true);
    tooltipBody.querySelector('p').textContent = this.text;
    tooltipElement.append(tooltipBody);
    const hostElPosLeft = this.hostElement.offsetLeft;
    const hostElPosTop = this.hostElement.offsetTop;
    const hostElHeight = this.hostElement.clientHeight;
    const parentElementScrolling = this.hostElement.parentElement.scrollTop;
    const x = hostElPosLeft + 20;
    const y = hostElPosTop + hostElHeight - parentElementScrolling - 10;
    tooltipElement.style.position = 'absolute';
    tooltipElement.style.left = x + 'px';
    tooltipElement.style.top = y + 'px';
    tooltipElement.addEventListener('click', this.closeTooltip);
    this.element = tooltipElement;
  }
}

class ChoreItem {
  hasActiveTooltip = false;
  constructor(id, updateChoreLists, type) {
    this.id = id;
    this.updateChoreListsHandler = updateChoreLists;
    this.connectMoreInfoButton();
    this.connectSwitchButton(type);
    this.connectDrag();
  }

  showMoreInfoHandler() {
    if (this.hasActiveTooltip) {
      return;
    }
    const choreElement = document.getElementById(this.id);
    const tooltipText = choreElement.dataset.extraInfo;
    const tooltip = new Tooltip(() => {
      this.hasActiveTooltip = false;
    }, tooltipText, this.id);
    tooltip.attach();
    this.hasActiveTooltip = true;
  }

  // Set as draggable
  connectDrag() {
    const item = document.getElementById(this.id);
    item.addEventListener('dragstart', event => {
      event.dataTransfer.setData('text/plain', this.id);
      event.dataTransfer.effectAllowed = 'move';
    });

    item.addEventListener('dragend', event => {
      console.log(event);
    });
  }

  connectMoreInfoButton() {
    const choreItemElement = document.getElementById(this.id);
    const moreInfoBtn = choreItemElement.querySelector(
      'button:first-of-type'
    );
    moreInfoBtn.addEventListener('click', this.showMoreInfoHandler.bind(this));
  }

  connectSwitchButton(type) {
    const choreItemElement = document.getElementById(this.id);
    let switchBtn = choreItemElement.querySelector('button:last-of-type');
    switchBtn = DOMHelper.clearEventListeners(switchBtn);
    switchBtn.textContent = type === 'active' ? 'Finish' : 'Activate';
    switchBtn.addEventListener(
      'click',
      this.updateChoreListsHandler.bind(null, this.id)
    );
  }

  update(updateChoreListsFunction, type) {
    this.updateChoreListsHandler = updateChoreListsFunction;
    this.connectSwitchButton(type);
  }
}

class ChoreList {
  chores = [];
  constructor(type) {
    this.type = type;
    const prjItems = document.querySelectorAll(`#${type}-chores li`);
    for (const prjItem of prjItems) {
      this.chores.push(
        new ChoreItem(prjItem.id, this.switchChore.bind(this), this.type)
      );
    }
    console.log(this.chores);
    this.connectDroppable();
  }

  //Drag & drop logic
  connectDroppable() {
    const list = document.querySelector(`#${this.type}-chores ul`);
    list.addEventListener('dragenter', event => {
      if (event.dataTransfer.types[0] === 'text/plain') {
        list.parentElement.classList.add('droppable');
        event.preventDefault();
      }
    });

    list.addEventListener('dragover', event => {
      if (event.dataTransfer.types[0] === 'text/plain') {
        event.preventDefault();
      }
    });

    list.addEventListener('dragleave', event => {
      if (event.relatedTarget.closest(`#${this.type}-chores ul`) !== list) {
        list.parentElement.classList.remove('droppable');
      }
    });

    list.addEventListener('drop', event => {
      const prjId = event.dataTransfer.getData('text/plain');
      if (this.chores.find(p => p.id === prjId)) {
        return;
      }
      document
        .getElementById(prjId)
        .querySelector('button:last-of-type')
        .click();
      list.parentElement.classList.remove('droppable');
    });
  }

  // Switch logic
  setSwitchHandlerFunction(switchHandlerFunction) {
    this.switchHandler = switchHandlerFunction;
  }

  addChore(chore) {
    this.chores.push(chore);
    DOMHelper.moveElement(chore.id, `#${this.type}-chores ul`);
    chore.update(this.switchChore.bind(this), this.type);
  }

  switchChore(choreId) {
    this.switchHandler(this.chores.find(p => p.id === choreId));
    this.chores = this.chores.filter(p => p.id !== choreId);
  }
}

class App {
  static init() {
    const activeChoresList = new ChoreList('active');
    const finishedChoresList = new ChoreList('finished');
    activeChoresList.setSwitchHandlerFunction(
      finishedChoresList.addChore.bind(finishedChoresList)
    );
    finishedChoresList.setSwitchHandlerFunction(
      activeChoresList.addChore.bind(activeChoresList)
    );
  } 
}

App.init();
