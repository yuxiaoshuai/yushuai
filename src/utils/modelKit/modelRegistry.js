import { MODEL_BASE_PATH } from './constants'

export { MODEL_BASE_PATH }

export const modelRegistry = {
  dancer: {
    id: 'dancer',
    name: '舞蹈角色模型',
    src: `${MODEL_BASE_PATH}dancer.glb`,
    defaultAnimation: 'SambaDance',
    fallbackAnimation: 'TPose',
    scale: 1,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    cameraPosition: [0, 1.2, 3],
    autoPlay: true,
    loop: true,
  },
}
