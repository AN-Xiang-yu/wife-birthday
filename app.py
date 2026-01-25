"""
生日纪念网站 · Flask 应用主入口

这是一个为老婆生日制作的纪念网站后端服务
情绪节奏：好奇 → 参与 → 回忆 → 共鸣 → 轻松 → 落点
"""

from flask import Flask, render_template, request, jsonify
from typing import Dict, Any, Optional
import json
import os

from config import ChatConfig, Config
from utils.helpers import load_json_data, validate_password, process_chat_input


app = Flask(__name__)
app.config.from_object(Config)


# ============================================================
# 页面路由
# ============================================================

@app.route("/")
def index() -> str:
    """渲染主页面（SPA 容器）
    
    Returns:
        str: 渲染后的 HTML 页面
    """
    # 传递前端需要的配置
    frontend_config = {
        "FINAL_MESSAGE": ChatConfig.FINAL_MESSAGE,
        "MAX_ATTEMPTS": ChatConfig.MAX_ATTEMPTS
    }
    return render_template("index.html", config=frontend_config)


# ============================================================
# API 路由
# ============================================================

@app.route("/api/chat", methods=["POST"])
def chat() -> Dict[str, Any]:
    """处理开场页的对话交互
    
    接收用户输入，根据关键词匹配返回相应回复
    最多允许 3 次交互，之后自动引导进入时间线
    
    Request Body:
        user_input (str): 用户输入的文字
        attempt_count (int): 当前尝试次数
        
    Returns:
        Dict: {
            "response": str,        # 系统回复
            "should_proceed": bool, # 是否应进入下一页面
            "hint": Optional[str]   # 温柔的提示（非错误）
        }
    """
    data = request.get_json()
    user_input: str = data.get("user_input", "")
    attempt_count: int = data.get("attempt_count", 0)
    
    result = process_chat_input(
        user_input=user_input,
        attempt_count=attempt_count,
        max_attempts=ChatConfig.MAX_ATTEMPTS
    )
    
    return jsonify(result)


@app.route("/api/verify-password", methods=["POST"])
def verify_password() -> Dict[str, Any]:
    """验证彩蛋页密码
    
    密码来源于只有她知道的事情
    错误时给出温柔的提示线索，而非否定
    
    Request Body:
        password (str): 用户输入的密码
        
    Returns:
        Dict: {
            "success": bool,            # 是否验证成功
            "secret_content": Optional[str],  # 解锁的隐藏内容
            "hint": Optional[str]       # 错误时的温柔提示
        }
    """
    data = request.get_json()
    password: str = data.get("password", "")
    
    result = validate_password(password)
    
    return jsonify(result)


@app.route("/api/content/<page_name>", methods=["GET"])
def get_page_content(page_name: str) -> Dict[str, Any]:
    """获取指定页面的内容数据
    
    Args:
        page_name: 页面名称，如 'timeline', 'letter', 'moments' 等
        
    Returns:
        Dict: 对应页面的内容数据
    """
    valid_pages = [
        "intro", "timeline", "moments", 
        "letter", "secret", "playful", "ending"
    ]
    
    if page_name not in valid_pages:
        return jsonify({"error": "页面不存在"}), 404
    
    content = load_json_data(f"data/content.json")
    page_content = content.get(page_name, {})
    
    return jsonify(page_content)


@app.route("/api/timeline", methods=["GET"])
def get_timeline() -> Dict[str, Any]:
    """获取时间线数据
    
    Returns:
        Dict: {
            "events": List[Dict],  # 时间线事件列表
            "total_count": int     # 事件总数
        }
    """
    timeline_data = load_json_data("data/timeline.json")
    
    return jsonify({
        "events": timeline_data.get("events", []),
        "total_count": len(timeline_data.get("events", []))
    })


# ============================================================
# 错误处理
# ============================================================

@app.errorhandler(404)
def not_found(error) -> tuple:
    """404 错误处理
    
    Args:
        error: 错误对象
        
    Returns:
        tuple: (响应内容, 状态码)
    """
    return jsonify({"error": "找不到请求的资源"}), 404


@app.errorhandler(500)
def internal_error(error) -> tuple:
    """500 错误处理
    
    Args:
        error: 错误对象
        
    Returns:
        tuple: (响应内容, 状态码)
    """
    return jsonify({"error": "服务器内部错误"}), 500


# ============================================================
# 启动应用
# ============================================================

if __name__ == "__main__":
    app.run(
        host=Config.HOST,
        port=Config.PORT,
        debug=Config.DEBUG
    )
