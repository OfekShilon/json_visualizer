// Function to highlight text within a node
function highlightText(node, searchText, caseSensitive) {
    if (node.nodeType === 3) { // Text node
        const text = node.nodeValue;
        let lowerText = caseSensitive ? text : text.toLowerCase();
        let lowerSearchText = caseSensitive ? searchText : searchText.toLowerCase();
        
        if (lowerText.includes(lowerSearchText)) {
            // For case-sensitive, use different regex flag
            const regexFlags = caseSensitive ? 'g' : 'gi';
            const parts = text.split(new RegExp(`(${searchText})`, regexFlags));
            const fragment = document.createDocumentFragment();
            
            parts.forEach(part => {
                if ((caseSensitive && part === searchText) || 
                    (!caseSensitive && part.toLowerCase() === lowerSearchText)) {
                    const span = document.createElement('span');
                    span.className = 'highlight';
                    span.textContent = part;
                    fragment.appendChild(span);
                } else {
                    fragment.appendChild(document.createTextNode(part));
                }
            });
            
            node.parentNode.replaceChild(fragment, node);
            return true;
        }
        return false;
    } else if (node.nodeType === 1) { // Element node
        // Skip highlight elements themselves
        if (node.classList && node.classList.contains('highlight')) {
            return false;
        }
        
        let found = false;
        const childNodes = [...node.childNodes]; // Create copy since the DOM could change during iteration
        
        childNodes.forEach(child => {
            found = highlightText(child, searchText, caseSensitive) || found;
        });
        
        return found;
    }
    return false;
}

// Function to remove all highlighting
function removeHighlights(node) {
    const highlights = node.querySelectorAll('.highlight');
    highlights.forEach(highlight => {
        const text = document.createTextNode(highlight.textContent);
        highlight.parentNode.replaceChild(text, highlight);
    });
    
    // Normalize the text nodes
    node.normalize();
}

// Function to expand nodes containing matches
function expandToMatches(element) {
    // First, collapse all nodes
    const allContents = document.querySelectorAll('.content');
    const allCollapsibles = document.querySelectorAll('.collapsible');
    
    allContents.forEach(content => {
        content.style.display = 'none';
    });
    
    allCollapsibles.forEach(collapsible => {
        collapsible.classList.remove('expanded');
    });
    
    // Now find all highlights
    const highlights = document.querySelectorAll('.highlight');
    
    // For each highlight, expand its parent path
    highlights.forEach(highlight => {
        // Walk up the DOM tree
        let currentElement = highlight;
        
        while (currentElement && currentElement !== element) {
            // If we find a content div, make it visible
            if (currentElement.classList && currentElement.classList.contains('content')) {
                currentElement.style.display = 'block';
                
                // Also expand its parent collapsible
                const collapsible = currentElement.previousElementSibling;
                if (collapsible && collapsible.classList.contains('collapsible')) {
                    collapsible.classList.add('expanded');
                }
            }
            
            currentElement = currentElement.parentElement;
        }
    });
    
    return highlights.length > 0;
}

// Function to save the expanded state of all nodes
function saveExpandedState() {
    const expandedState = {};
    const collapsibles = document.querySelectorAll('.collapsible');
    
    collapsibles.forEach((collapsible, index) => {
        const isExpanded = collapsible.classList.contains('expanded');
        const path = getNodePath(collapsible);
        expandedState[path] = isExpanded;
    });
    
    return expandedState;
}

// Function to restore the expanded state of nodes
function restoreExpandedState(expandedState) {
    const collapsibles = document.querySelectorAll('.collapsible');
    
    collapsibles.forEach((collapsible) => {
        const path = getNodePath(collapsible);
        if (expandedState[path]) {
            collapsible.classList.add('expanded');
            const content = collapsible.nextElementSibling;
            if (content && content.classList.contains('content')) {
                content.style.display = 'block';
            }
        }
    });
}

// Function to get a unique path for a node
function getNodePath(element) {
    let path = [];
    let current = element;
    
    // Walk up to the ul parent
    while (current && current.tagName !== 'UL') {
        current = current.parentElement;
    }
    
    if (!current) return '';
    
    // Find the li that contains this element
    const li = element.closest('li');
    if (!li) return '';
    
    // Get the text content of the node (the key)
    const key = element.textContent;
    
    // Find the index of this li among its siblings
    const liIndex = Array.from(current.children).indexOf(li);
    
    // Get the parent ul's path
    let parentUl = current.parentElement;
    if (parentUl && parentUl.tagName === 'DIV' && parentUl.classList.contains('content')) {
        parentUl = parentUl.parentElement;
    }
    
    if (parentUl && parentUl.tagName === 'LI') {
        const parentCollapsible = parentUl.querySelector('.collapsible');
        if (parentCollapsible) {
            path.unshift(getNodePath(parentCollapsible));
        }
    }
    
    path.push(key + ':' + liIndex);
    return path.join('/');
}

function createTree(data) {
    if (typeof data === 'object' && data !== null) {
        const ul = document.createElement('ul');
        
        // Check if it's an array
        const isArray = Array.isArray(data);
        
        for (const key in data) {
            const value = data[key];
            
            // Skip null values if hide-nulls is checked
            if (document.getElementById('hide-nulls').checked && value === null) {
                continue;
            }
            
            const li = document.createElement('li');
            li.dataset.valueType = value === null ? 'null' : typeof value;
            
            // Display name property for array items if available
            let displayKey = key;
            if (isArray && typeof value === 'object' && value !== null && 'name' in value) {
                displayKey = `${key}: ${value.name}`;
            }
            
            // Check if value is a primitive (not an object or is null) or an empty object/array
            const isPrimitive = 
                value === null || 
                typeof value !== 'object' || 
                (Array.isArray(value) && value.length === 0) ||
                (Object.keys(value).length === 0);
                
            if (isPrimitive) {
                // For single values, display as "name : value" with color coding
                const keySpan = document.createElement('span');
                keySpan.textContent = displayKey;
                keySpan.className = 'json-key';
                li.appendChild(keySpan);
                
                li.appendChild(document.createTextNode(' : '));
                
                const valueSpan = document.createElement('span');
                if (value === null) {
                    valueSpan.textContent = 'null';
                    valueSpan.className = 'json-null';
                } else if (Array.isArray(value) && value.length === 0) {
                    valueSpan.textContent = '[]';
                    valueSpan.className = 'json-array-empty';
                } else if (typeof value === 'object' && Object.keys(value).length === 0) {
                    valueSpan.textContent = '{}';
                    valueSpan.className = 'json-object-empty';
                } else if (typeof value === 'number') {
                    valueSpan.textContent = value;
                    valueSpan.className = 'json-number';
                } else if (typeof value === 'boolean') {
                    valueSpan.textContent = value;
                    valueSpan.className = 'json-boolean';
                } else {
                    valueSpan.textContent = value;
                    valueSpan.className = 'json-value';
                }
                li.appendChild(valueSpan);
            } else {
                // For objects and arrays, keep the collapsible functionality
                const span = document.createElement('span');
                span.textContent = displayKey;
                span.classList.add('collapsible', 'json-key');
                li.appendChild(span);

                const content = document.createElement('div');
                content.classList.add('content');
                content.appendChild(createTree(data[key]));
                li.appendChild(content);

                span.addEventListener('click', () => {
                    const isExpanded = content.style.display === 'block';
                    content.style.display = isExpanded ? 'none' : 'block';
                    span.classList.toggle('expanded', !isExpanded);
                });
            }
            
            ul.appendChild(li);
        }
        return ul;
    } else {
        const li = document.createElement('li');
        
        // Color code different value types
        const valueSpan = document.createElement('span');
        if (data === null) {
            valueSpan.textContent = 'null';
            valueSpan.className = 'json-null';
        } else if (typeof data === 'number') {
            valueSpan.textContent = data;
            valueSpan.className = 'json-number';
        } else if (typeof data === 'boolean') {
            valueSpan.textContent = data;
            valueSpan.className = 'json-boolean';
        } else {
            valueSpan.textContent = data;
            valueSpan.className = 'json-value';
        }
        li.appendChild(valueSpan);
        return li;
    }
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
        
        // Recreate the tree
        container.appendChild(createTree(jsonData));
        
        // Restore the expanded state
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