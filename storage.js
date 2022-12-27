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
            { keyPath: "key" }
        );
    };

    await requestAsPromise(request);
    database = request.result;
}


export async function put(key, value)
{
    let transaction = database.transaction([DB_STORE_NAME], "readwrite");
    let promise = requestAsPromise(transaction, "oncomplete");

    let objectStore = transaction.objectStore(DB_STORE_NAME);
    let request = objectStore.put(
        {
            key: key,
            ...value
        }
    );

    return promise;
}


export async function get(key)
{
    let transaction = database.transaction([DB_STORE_NAME], "readonly");
    let promise = requestAsPromise(transaction, "oncomplete");

    let objectStore = transaction.objectStore(DB_STORE_NAME);
    let request = objectStore.get(key);

    let result;
    request.onsuccess = function(event)
    {
        result = event.target.result;
    };

    await promise;
    return result;
}


const DB_NAME = "storage";
const DB_STORE_NAME = "storage";
const DB_VERSION = 1;
let database;