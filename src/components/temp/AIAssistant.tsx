import { Bot } from "lucide-react";

export function AIAssistant() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 mb-16">
      <div className="flex items-center mb-6">
        <div className="p-3 bg-green-100 rounded-full mr-4">
          <Bot className="w-6 h-6 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">AI 어시스턴트</h2>
      </div>
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <Bot className="w-4 h-4 text-green-600" />
          </div>
          <div className="bg-green-50 p-4 rounded-lg flex-1">
            <p className="text-gray-800">
              &ldquo;안녕하세요! 저는 PipeMate AI 어시스턴트입니다. GitHub
              Actions 워크플로우에 대해 궁금한 점이 있으시면 언제든 물어보세요.
              워크플로우 최적화, 에러 해결, 새로운 기능 구현 등 다양한 도움을
              드릴 수 있습니다.&rdquo;
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <span className="text-blue-600 text-sm font-medium">U</span>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg flex-1">
            <p className="text-gray-800">
              &ldquo;워크플로우가 실패했는데 어떻게 해결할 수 있을까요?&rdquo;
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <Bot className="w-4 h-4 text-green-600" />
          </div>
          <div className="bg-green-50 p-4 rounded-lg flex-1">
            <p className="text-gray-800">
              &ldquo;실패한 워크플로우를 분석해보겠습니다. 먼저 실패한 Step의
              로그를 확인해보시고, 오른쪽 사이드바에서 GitHub Actions Flow를
              클릭하여 워크플로우를 시각적으로 탐색해보세요. 각 Step을 클릭하면
              상세한 로그를 볼 수 있습니다.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
