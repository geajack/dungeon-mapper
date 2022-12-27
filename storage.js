function requestAsPromise(request, callbackName)
{
    callbackName = callbackName || "onsuccess";

    return new Promise(
        function(resolve, reject)
        {
            request[callbackName] = function(event)
            {
                resolve();
            };

            request.onerror = function(event)
            {
                reject();
            };
        }
    );
}

export async function initialize()
{
    var request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = function(event)
    {
        console.log("openDb.onupgradeneeded");
        event.currentTarget.result.createObjectStore(
            DB_STORE_NAME,
            { keyPath: ["dungeonName", "level"] }
        );
    };

    await requestAsPromise(request);
    database = request.result;
}


export async function put(name, level, value)
{
    let transaction = database.transaction([DB_STORE_NAME], "readwrite");
    let promise = requestAsPromise(transaction, "oncomplete");

    let objectStore = transaction.objectStore(DB_STORE_NAME);
    let request = objectStore.put(
        {
            dungeonName: name,
            level: level,
            ...value
        }
    );

    return promise;
}


export async function get(name, level)
{
    let transaction = database.transaction([DB_STORE_NAME], "readonly");
    let promise = requestAsPromise(transaction, "oncomplete");

    let objectStore = transaction.objectStore(DB_STORE_NAME);
    let request = objectStore.get([name, level]);

    let result;
    request.onsuccess = function(event)
    {
        result = event.target.result;
    };

    await promise;
    return result;
}


export async function countLevels(name)
{
    let transaction = database.transaction([DB_STORE_NAME], "readonly");
    let promise = requestAsPromise(transaction, "oncomplete");

    let objectStore = transaction.objectStore(DB_STORE_NAME);
    let request = objectStore.count(IDBKeyRange.bound([name, 0], [name, 0xFFFF]));

    let result;
    request.onsuccess = function(event)
    {
        result = event.target.result;
    };

    await promise;
    return result;
}


const DB_NAME = "storage";
const DB_STORE_NAME = "dungeons";
const DB_VERSION = 1;
let database;