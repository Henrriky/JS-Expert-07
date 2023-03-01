import Camera from "../../../lib/shared/camera.js";
import { supportsWorkerType } from "../../../lib/shared/util.js";
import Controller from "./controller.js";
import Service from "./service.js";
import View from "./view.js";

async function getWorker() {

  if (supportsWorkerType()) {
    console.log("Initializing esm workers");
    const worker = new Worker('./src/worker.js', { type: 'module' }) //O Worker está na raiz, e é nele que o worker será injetado, então é necessário acessar a partir do local atual dele
    return worker
  }
  console.warn(`Your browser doesn't support esm modules on webworkers!`)
  console.warn(`Importing libraries...`)
  //Importing
  await import ("https://unpkg.com/@tensorflow/tfjs-core@2.4.0/dist/tf-core.js")
  await import ("https://unpkg.com/@tensorflow/tfjs-converter@2.4.0/dist/tf-converter.js")
  await import ("https://unpkg.com/@tensorflow/tfjs-backend-webgl@2.4.0/dist/tf-backend-webgl.js")
  await import ("https://unpkg.com/@tensorflow-models/face-landmarks-detection@0.0.1/dist/face-landmarks-detection.js")
  
  console.warn(`using work mock intead`);
  const service = new Service({
    faceLandmarksDetection: window.faceLandmarksDetection
  })

  const workerMock = {
    async postMessage(video) {
      const blinked = await service.handBlinked(video);
      if(!blinked) return;
      workerMock.onmessage({ data: { blinked }})
    },
    onmessage(msg) { }
  }
  console.log('Loading tf model...')
  await service.loadModel();
  console.log('Tf model loaded successfully')

  setTimeout(() => {
    workerMock.onmessage({ data: 'READY' })
  }, 500)
  return workerMock;
}

//Verificando se o WebWorker é suportado no navegador
const worker = await getWorker();
const camera = await Camera.init();

const [rootPath] = window.location.href.split('/pages/')
const factory = { //Factory passa as dependencias(Servies e View) e Inicia o Controller
  async initialize() {
    return Controller.initialize({ //Controller inicia o service e view, ou seja, intermediário 
      view: new View(),
      worker: worker,
      camera
    })
  }
}

export default factory