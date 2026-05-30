export const caseGroups = [
  {
    id: 'digital-twin',
    title: '数字孪生',
    description: '围绕园区、工厂、设备和城市空间的三维可视化与实时态势展示。',
    cases: [
      {
        id: 'factory-ray-inspection',
        title: '工厂射线巡检',
        wheelLabel: '射线巡检',
        screenKey: 'FactoryRayInspectionCaseScreen',
        routePath: '/demo/factory-ray-inspection',
        summary: '数字孪生巡检、路径巡检、设备范围检测。',
        tags: ['数字孪生巡检', '路径巡检', '设备范围检测'],
        visual: 'city',
        metricLabel: '检测范围',
        metricValue: 'XYZ',
        accent: '#22d3ee',
        metrics: [
          { label: '巡检路线', value: '105 点' },
          { label: '检测范围', value: 'XYZ' },
          { label: '设备记录', value: '一次' },
          { label: '小地图', value: '实时' },
        ],
        panels: [],
        modelItems: [],
      },
    ],
  },
  {
    id: 'gsap',
    title: 'GSAP',
    description: 'GSAP 与 Three.js 结合的滚动交互案例。',
    cases: [
      {
        id: 'robot-scroll',
        title: '机器人',
        wheelLabel: '机器人',
        type: 'GSAP / Three.js',
        screenKey: 'RobotScrollShowcase',
        screenMode: 'internal-scroll',
        routePath: '/demo/robot-scroll',
        summary: '基于 ScrollTrigger 的 3D 机器人部位聚焦展示。',
        tags: ['GSAP', 'Three.js', 'ScrollTrigger'],
        visual: 'robot',
        metricLabel: 'Scroll',
        metricValue: '4',
        accent: '#36f7ff',
        metrics: [
          { label: '阶段', value: '4' },
          { label: '模型', value: 'GLB' },
          { label: '驱动', value: 'GSAP' },
          { label: '标签', value: '3D 投影' },
        ],
        panels: [],
        modelItems: [
          {
            key: 'robot',
            label: '机器人',
            path: '/gltf/robot.glb',
            fallbackPath: '/models/gltf/robot.glb',
            colorIndex: 0,
          },
        ],
      },
    ],
  },
  {
    id: 'excellent-cases',
    title: '优秀案例',
    description: '沉淀交付效果较完整、可复用价值较高的综合项目案例。',
    cases: [
      {
        id: '3d-model-viewer',
        title: '3D 模型动画展示',
        wheelLabel: '3D Model',
        screenKey: 'ModelViewerCaseScreen',
        routePath: '/demo/3d-model-viewer',
        summary: '基于 GLB / GLTF 的模型加载与动画切换展示。',
        tags: ['3D Model', 'GLB', '动画'],
        visual: 'room',
        metricLabel: '动画',
        metricValue: '3',
        accent: '#7dd3fc',
        metrics: [
          { label: '模型格式', value: 'GLB' },
          { label: '默认动画', value: 'SambaDance' },
          { label: '动画数量', value: '3' },
          { label: '模型来源', value: 'gltf' },
        ],
        panels: [],
        modelItems: [
          {
            key: 'dancer',
            label: '舞蹈角色模型',
            path: '/models/gltf/dancer.glb',
            colorIndex: 0,
          },
        ],
      },
    ],
  },
]

export const cases = caseGroups.flatMap((group) =>
  group.cases.map((item) => ({
    ...item,
    groupId: group.id,
    groupTitle: group.title,
  })),
)

export function findCase(caseId) {
  return cases.find((item) => item.id === String(caseId || ''))
}
