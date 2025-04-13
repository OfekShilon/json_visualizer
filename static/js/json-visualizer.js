// Function to highlight text within a node
function highlightText(node, searchText, caseSensitive) {
    if (node.nodeType === Node.TEXT_NODE) {
        const nodeText = node.textContent;
        const searchTextToUse = caseSensitive ? searchText : searchText.toLowerCase();
        const textToSearch = caseSensitive ? nodeText : nodeText.toLowerCase();
        const index = textToSearch.indexOf(searchTextToUse);
        
        if (index >= 0) {
            // Create a highlight element
            const highlightEl = document.createElement('span');
            highlightEl.className = 'highlight';
            
            // Extract the matched text to preserve original case
            const matchedText = nodeText.substring(index, index + searchText.length);
            highlightEl.textContent = matchedText;
            
            // Text before the match
            const beforeText = document.createTextNode(nodeText.substring(0, index));
            // Text after the match
            const afterText = document.createTextNode(nodeText.substring(index + searchText.length));
            
            // Replace the text node with the highlighted version
            const parent = node.parentNode;
            parent.insertBefore(beforeText, node);
            parent.insertBefore(highlightEl, node);
            parent.insertBefore(afterText, node);
            parent.removeChild(node);
            
            return true;
        }
    } else if (node.nodeType === Node.ELEMENT_NODE && 
              !node.classList.contains('highlight')) {
        let found = false;
        const childNodes = Array.from(node.childNodes);
        
        childNodes.forEach(child => {
            if (highlightText(child, searchText, caseSensitive)) {
                found = true;
            }
        });
        
        return found;
    }
    
    return false;
}

// Function to remove all highlighting
function removeHighlights(node) {
    const highlights = node.querySelectorAll('.highlight');
    
    highlights.forEach(highlight => {
        const parent = highlight.parentNode;
        const text = document.createTextNode(highlight.textContent);
        parent.replaceChild(text, highlight);
    });
    
    // Also normalize the text nodes to ensure proper text searching
    node.normalize();
}

// Function to expand nodes containing matches
function expandToMatches(element) {
    const highlights = element.querySelectorAll('.highlight');
    
    highlights.forEach(highlight => {
        let parent = highlight.parentNode;
        
        // Traverse up the DOM to find and expand all parent content nodes
        while (parent && parent !== element) {
            if (parent.classList && parent.classList.contains('content')) {
                parent.style.display = 'block';
                
                // Also expand the parent collapsible
                const collapsible = parent.previousElementSibling;
                if (collapsible && collapsible.classList.contains('collapsible')) {
                    collapsible.classList.add('expanded');
                }
            }
            parent = parent.parentNode;
        }
    });
}

// Function to save the expanded state of all nodes
function saveExpandedState() {
    const expandedState = {};
    const collapsibleElements = document.querySelectorAll('.collapsible');
    
    collapsibleElements.forEach(element => {
        const path = getNodePath(element);
        expandedState[path] = element.classList.contains('expanded');
    });
    
    return expandedState;
}

// Function to restore the expanded state of nodes
function restoreExpandedState(expandedState) {
    const collapsibleElements = document.querySelectorAll('.collapsible');
    
    collapsibleElements.forEach(element => {
        const path = getNodePath(element);
        if (expandedState[path]) {
            element.classList.add('expanded');
            if (element.nextElementSibling && element.nextElementSibling.classList.contains('content')) {
                element.nextElementSibling.style.display = 'block';
            }
        } else {
            element.classList.remove('expanded');
            if (element.nextElementSibling && element.nextElementSibling.classList.contains('content')) {
                element.nextElementSibling.style.display = 'none';
            }
        }
    });
}

// Function to get a unique path for a node
function getNodePath(element) {
    const path = [];
    let current = element;
    
    while (current && current.parentNode) {
        const parent = current.parentNode;
        const children = Array.from(parent.children);
        
        if (children.length > 0) {
            const index = children.indexOf(current);
            if (index > -1) {
                path.unshift(index);
            }
        }
        
        current = parent;
    }
    
    return path.join('.');
}

function createTree(data, currentPath = '', lineCounter = { value: 1 }) {
    const ul = document.createElement('ul');
    
    if (typeof data === 'object' && data !== null) {
        const isArray = Array.isArray(data);
        
        // Handle empty arrays or objects
        if (Object.keys(data).length === 0) {
            const li = document.createElement('li');
            // Add line number
            const lineNumber = document.createElement('span');
            lineNumber.className = 'line-number';
            lineNumber.textContent = `${lineCounter.value++}: `;
            li.appendChild(lineNumber);
            
            const valueSpan = document.createElement('span');
            valueSpan.className = isArray ? 'json-array-empty' : 'json-object-empty';
            valueSpan.textContent = isArray ? '[]' : '{}';
            li.appendChild(valueSpan);
            ul.appendChild(li);
            return ul;
        }
        
        // Process each property
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const value = data[key];
                const newPath = currentPath ? `${currentPath}.${key}` : key;
                const li = document.createElement('li');
                
                // Add line number
                const lineNumber = document.createElement('span');
                lineNumber.className = 'line-number';
                lineNumber.textContent = `${lineCounter.value++}: `;
                li.appendChild(lineNumber);
                
                // Exclude null/undefined values if hide-nulls is checked
                const hideNulls = document.getElementById('hide-nulls').checked;
                if (hideNulls && (value === null || value === undefined)) {
                    lineCounter.value--; // Decrement counter for skipped items
                    continue;
                }
                
                // Different display for objects and arrays vs primitive values
                if (typeof value === 'object' && value !== null) {
                    const collapsible = document.createElement('span');
                    collapsible.className = 'collapsible';
                    collapsible.textContent = `${key}: ${Array.isArray(value) ? '[' : '{'}`;
                    collapsible.onclick = function(e) {
                        this.classList.toggle('expanded');
                        const content = this.nextElementSibling;
                        content.style.display = content.style.display === 'block' ? 'none' : 'block';
                        e.stopPropagation();
                    };
                    
                    const contentDiv = document.createElement('div');
                    contentDiv.className = 'content';
                    contentDiv.appendChild(createTree(value, newPath, lineCounter));
                    
                    const closingSymbol = document.createElement('span');
                    closingSymbol.textContent = Array.isArray(value) ? ']' : '}';
                    
                    li.appendChild(collapsible);
                    li.appendChild(contentDiv);
                    contentDiv.appendChild(closingSymbol);
                } else {
                    let formattedValue = '';
                    
                    // Format the value based on its type
                    if (value === null) {
                        formattedValue = `<span class="json-null">null</span>`;
                    } else if (typeof value === 'string') {
                        formattedValue = `<span class="json-value">"${value}"</span>`;
                    } else if (typeof value === 'number') {
                        formattedValue = `<span class="json-number">${value}</span>`;
                    } else if (typeof value === 'boolean') {
                        formattedValue = `<span class="json-boolean">${value}</span>`;
                    } else {
                        formattedValue = `<span>${value}</span>`;
                    }
                    
                    const keySpan = document.createElement('span');
                    keySpan.className = 'json-key';
                    keySpan.textContent = `${key}: `;
                    li.appendChild(keySpan);
                    li.insertAdjacentHTML('beforeend', formattedValue);
                }
                
                ul.appendChild(li);
            }
        }
    } else {
        const li = document.createElement('li');
        li.className = 'single-value';
        
        // Add line number
        const lineNumber = document.createElement('span');
        lineNumber.className = 'line-number';
        lineNumber.textContent = `${lineCounter.value++}: `;
        li.appendChild(lineNumber);
        
        // Format the value based on its type
        if (data === null) {
            li.innerHTML += `<span class="json-null">null</span>`;
        } else if (typeof data === 'string') {
            li.innerHTML += `<span class="json-value">"${data}"</span>`;
        } else if (typeof data === 'number') {
            li.innerHTML += `<span class="json-number">${data}</span>`;
        } else if (typeof data === 'boolean') {
            li.innerHTML += `<span class="json-boolean">${data}</span>`;
        } else {
            li.innerHTML += `<span>${data}</span>`;
        }
        
        ul.appendChild(li);
    }
    
    return ul;
}

// Initialize the visualizer when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const jsonData = JSON.parse(document.getElementById('json-data').textContent);
    const container = document.getElementById('json-container');
    let currentSearchText = '';
    let isSearchCaseSensitive = false;
    
    container.appendChild(createTree(jsonData));
    
    // Add event listener to the hide-nulls checkbox
    document.getElementById('hide-nulls').addEventListener('change', function() {
        // Save the search state
        currentSearchText = document.getElementById('search-input').value.trim();
        isSearchCaseSensitive = document.getElementById('case-sensitive').checked;
        
        // Save the expanded state
        const expandedState = saveExpandedState();
        
        // Remove the existing tree
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        // Create the tree
        container.appendChild(createTree(jsonData));
        
        // Restore the previous expanded state
        restoreExpandedState(expandedState);
        
        // Reapply search highlights if there was an active search
        if (currentSearchText) {
            highlightText(container, currentSearchText, isSearchCaseSensitive);
        }
    });
    
    // Add event listener to the line-wrap checkbox
    document.getElementById('line-wrap').addEventListener('change', function() {
        if (this.checked) {
            container.classList.add('with-line-wrap');
            container.classList.remove('no-line-wrap');
        } else {
            container.classList.remove('with-line-wrap');
            container.classList.add('no-line-wrap');
        }
    });
    
    // Add event listener to the show-line-numbers checkbox
    document.getElementById('show-line-numbers').addEventListener('change', function() {
        const lineNumbers = document.querySelectorAll('.line-number');
        
        if (this.checked) {
            lineNumbers.forEach(el => {
                el.style.display = 'inline-block';
            });
        } else {
            lineNumbers.forEach(el => {
                el.style.display = 'none';
            });
        }
    });
    
    // Add event listener for search
    function performSearch() {
        const searchText = document.getElementById('search-input').value.trim();
        if (searchText === '') return;
        
        const caseSensitive = document.getElementById('case-sensitive').checked;
        
        // Save current search parameters for later reuse
        currentSearchText = searchText;
        isSearchCaseSensitive = caseSensitive;
        
        // First, remove any existing highlights
        removeHighlights(container);
        
        // Then search and highlight with case sensitivity option
        highlightText(container, searchText, caseSensitive);
        
        // Only expand paths to matches
        expandToMatches(container);
    }
    
    document.getElementById('search-button').addEventListener('click', performSearch);
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Also add event listener to the case-sensitive checkbox
    document.getElementById('case-sensitive').addEventListener('change', function() {
        if (currentSearchText) {
            // Re-run the search with the new case sensitivity setting
            const searchText = document.getElementById('search-input').value.trim();
            isSearchCaseSensitive = this.checked;
            
            // First, remove any existing highlights
            removeHighlights(container);
            
            // Then search and highlight with case sensitivity option
            highlightText(container, searchText, isSearchCaseSensitive);
        }
    });
});