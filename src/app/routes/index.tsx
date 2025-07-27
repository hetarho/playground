import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">WebGL 데모 프로젝트</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Three.js 3D 데모 */}
        <Link
          to="/three"
          className="block p-6 bg-gradient-to-br from-blue-600 to-purple-700 rounded-lg hover:from-blue-700 hover:to-purple-800 transition-all duration-300 transform hover:scale-105"
        >
          <h2 className="text-2xl font-semibold text-white mb-3">
            3D 스크롤 공간
          </h2>
          <p className="text-blue-100 mb-4">
            Three.js를 사용한 3D 환경에서 스크롤로 앞뒤 이동하는 인터랙티브 데모
          </p>
          <div className="text-sm text-blue-200">
            ✨ Three.js • 3D Graphics • Mouse/Touch Control
          </div>
        </Link>

        {/* MetaBall 2D 데모 */}
        <Link
          to="/metaball"
          className="block p-6 bg-gradient-to-br from-cyan-600 to-teal-700 rounded-lg hover:from-cyan-700 hover:to-teal-800 transition-all duration-300 transform hover:scale-105"
        >
          <h2 className="text-2xl font-semibold text-white mb-3">
            메타볼 효과
          </h2>
          <p className="text-cyan-100 mb-4">
            WebGL 셰이더를 사용한 2D 메타볼 효과 - 원들이 부드럽게 연결되는
            인터랙티브 데모
          </p>
          <div className="text-sm text-cyan-200">
            ✨ WebGL Shaders • 2D Effects • Real-time Interaction
          </div>
        </Link>

        {/* Canvas 데모 */}
        <Link
          to="/canvas"
          className="block p-6 bg-gradient-to-br from-green-600 to-emerald-700 rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all duration-300 transform hover:scale-105"
        >
          <h2 className="text-2xl font-semibold text-white mb-3">
            캔버스 효과
          </h2>
          <p className="text-green-100 mb-4">
            HTML5 Canvas를 사용한 다양한 2D 그래픽 효과들
          </p>
          <div className="text-sm text-green-200">
            ✨ Canvas 2D • Multiple Effects • Interactive
          </div>
        </Link>

        {/* About 페이지 */}
        <Link
          to="/gilt-bronze-incense-burner"
          className="block p-6 bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-lg hover:from-yellow-700 hover:to-yellow-800 transition-all duration-300 transform hover:scale-105"
        >
          <h2 className="text-2xl font-semibold text-white mb-3">금동대향로</h2>
          <p className="text-gray-100 mb-4">금동 대향로에서 영감을 받은 작품</p>
          <div className="text-sm text-gray-200">
            ✨ Canvas 2D • Multiple Effects • Interactive
          </div>
        </Link>

        {/* About 페이지 */}
        <Link
          to="/about"
          className="block p-6 bg-gradient-to-br from-gray-600 to-slate-700 rounded-lg hover:from-gray-700 hover:to-slate-800 transition-all duration-300 transform hover:scale-105"
        >
          <h2 className="text-2xl font-semibold text-white mb-3">
            프로젝트 정보
          </h2>
          <p className="text-gray-100 mb-4">
            이 프로젝트에 대한 자세한 정보와 기술 스택
          </p>
          <div className="text-sm text-gray-200">
            ℹ️ Information • Tech Stack • Details
          </div>
        </Link>
      </div>

      <div className="mt-12 p-6 bg-gray-900 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-4">기술 스택</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center p-3 bg-gray-800 rounded">
            <div className="text-blue-400 font-medium">React</div>
            <div className="text-gray-400">UI Framework</div>
          </div>
          <div className="text-center p-3 bg-gray-800 rounded">
            <div className="text-purple-400 font-medium">TypeScript</div>
            <div className="text-gray-400">Type Safety</div>
          </div>
          <div className="text-center p-3 bg-gray-800 rounded">
            <div className="text-green-400 font-medium">Three.js</div>
            <div className="text-gray-400">3D Graphics</div>
          </div>
          <div className="text-center p-3 bg-gray-800 rounded">
            <div className="text-cyan-400 font-medium">WebGL</div>
            <div className="text-gray-400">GPU Shaders</div>
          </div>
        </div>
      </div>
    </div>
  );
}
