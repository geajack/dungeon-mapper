export function bind(node, controllerClass, otherControllerClasses, components)
{
    let controller = new controllerClass();

    let dictOfClasses = {};
    for (let controllerClass of otherControllerClasses)
    {
        dictOfClasses[controllerClass.name] = controllerClass;
    }

    let dictOfComponents = {};
    for (let component of components)
    {
        dictOfComponents[component.name.toUpperCase()] = component;
    }

    return bindChild(node, null, controller, dictOfClasses, dictOfComponents);
}

export function create(component, controllerClasses, otherComponents)
{
    let clonedFragment = component.fragment.cloneNode(true); // fail if no fragment
    let controller = bind(clonedFragment, component.controllerClass, controllerClasses, otherComponents);
    return controller;
}

export function component(name, htmlFragment, controllerClass)
{
    return {
        name: name,
        fragment: htmlFragment,
        controllerClass: controllerClass
    }
}

function bindChild(childNode, parentController, childController, controllerClasses, components)
{
    let nodeOrFragment = childNode;
    let tagName = childNode.tagName;
    let isFragment = false;

    if (components[tagName] !== undefined)
    {
        let component = components[tagName];
        if (component.fragment)
        {
            nodeOrFragment = component.fragment.cloneNode(true); // todo fail if not empty tag
            isFragment = true;
        }
    }

    if (!childController)
    {
        let controllerClass = null;
        let controllerClassName = childNode.getAttribute("controller");
        if (controllerClassName)
        {
            controllerClass = controllerClasses[controllerClassName]; // still works if we explicitly specify a class that's undefined, should be an error
        }

        if (!controllerClass)
        {
            if (components[tagName] !== undefined)
            {
                let component = components[tagName];
                if (component.controllerClass)
                {
                    controllerClass = component.controllerClass;
                }
            }
        }
        
        if (controllerClass)
        {
            childController = new controllerClass();
        }
    }

    let returnValue;
    let controller;
    if (childController)
    {
        returnValue = childController;
        controller = childController;
        
        childController.html = nodeOrFragment;
    }
    else
    {
        returnValue = nodeOrFragment;
        controller = parentController;
    }

    for (let node of nodeOrFragment.childNodes)
    {
        if (node.nodeType === Node.TEXT_NODE)
        {
            continue;
        }

        if (node.nodeType === Node.COMMENT_NODE)
        {
            continue;
        }

        let value = bindChild(node, controller, null, controllerClasses, components);
        let bindName = node.getAttribute("bind");
        if (bindName)
        {
            if (bindName.endsWith("[]"))
            {
                let arrayName = bindName.slice(0, -2);
                if (controller[arrayName] === undefined)
                {
                    controller[arrayName] = new Array();
                }
                controller[arrayName].push(value);
            }
            else
            {
                controller[bindName] = value;
            }
        }
    }

    let childNodeOrController = childController ? childController : childNode;
    for (let attribute of childNode.attributes)
    {
        if (attribute.name.startsWith("vb-"))
        {
            let parameterName = attribute.name.slice(3);
            childNodeOrController[parameterName] = attribute.value;
        }
    }

    if (childController)
    {
        if (childController.initialize)
        {
            childController.initialize(nodeOrFragment);
        }
    }

    if (isFragment)
    {
        childNode.parentNode.insertBefore(nodeOrFragment, childNode); // we assume childNode has a parent
        childNode.parentNode.removeChild(childNode);
    }

    return returnValue;
}