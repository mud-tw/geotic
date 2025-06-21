import { Engine } from './src/Engine.js';
import { Component } from './src/Component.js';

class ComponentA extends Component { // 定義 ComponentA 類別，繼承自 Component
    static allowMultiple = true; // 允許此組件在同一個實體上有多個實例
}

class ComponentB extends Component { // 定義 ComponentB 類別，繼承自 Component
    static allowMultiple = true; // 允許此組件在同一個實體上有多個實例
    static keyProperty = 'k'; // 指定用於區分多個實例的屬性鍵
    static properties = { // 定義組件的屬性及其預設值
        k: 0, // 屬性 k，預設值為 0
    };
}

class ComponentC extends Component {} // 定義 ComponentC 類別，繼承自 Component

let engine; // 宣告 engine 變數
let world; // 宣告 world 變數

let time = 0; // 初始化總時間為 0
const testCount = 30; // 設定測試執行次數

for (let i = 0; i < testCount; i++) { // 迴圈執行指定次數的測試
    engine = new Engine(); // 創建新的 Engine 實例
    world = engine.createWorld(); // 從 engine 創建新的 World 實例

    engine.registerComponent(ComponentA); // 註冊 ComponentA
    engine.registerComponent(ComponentB); // 註冊 ComponentB
    engine.registerComponent(ComponentC); // 註冊 ComponentC

    world.createQuery({ // 創建一個查詢，匹配所有包含 ComponentA 的實體
        all: [ComponentA], 
    });

    world.createQuery({ // 創建一個查詢，匹配所有包含 ComponentB 的實體
        all: [ComponentB], 
    });

    world.createQuery({ // 創建一個查詢，匹配所有包含 ComponentC 的實體
        all: [ComponentC], 
    });

    const start = Date.now(); // 記錄開始時間

    for (let j = 0; j < 10000; j++) { // 迴圈創建、添加組件、銷毀實體 10000 次
        const entity = world.createEntity(); // 創建一個新實體
        entity.add(ComponentA); // 為實體添加 ComponentA
        entity.add(ComponentB); // 為實體添加 ComponentB
        entity.add(ComponentC); // 為實體添加 ComponentC
        entity.destroy(); // 銷毀實體
    }

    const end = Date.now(); // 記錄結束時間
    const delta = end - start; // 計算時間差

    console.log(`T(${i}) ${Math.round(delta)}ms`); // 輸出當前測試的執行時間

    time += delta; // 將當前測試的時間加到總時間中
}

const avg = time / testCount; // 計算平均執行時間

console.log(`AVG(${testCount}) ${Math.round(avg)}ms`); // 輸出平均執行時間
