"""
生日纪念网站 · 工具函数

包含数据加载、密码验证、对话处理等辅助函数
"""

import json
import os
from typing import Dict, Any, Optional, List

from config import Config, ChatConfig, SecretConfig


def load_json_data(file_path: str) -> Dict[str, Any]:
    """从 JSON 文件加载数据
    
    Args:
        file_path: JSON 文件的相对路径（相对于项目根目录）
        
    Returns:
        Dict: JSON 文件解析后的字典数据
        
    Raises:
        FileNotFoundError: 文件不存在时抛出
        json.JSONDecodeError: JSON 格式错误时抛出
    """
    full_path = os.path.join(Config.BASE_DIR, file_path)
    
    try:
        with open(full_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"警告：文件 {file_path} 不存在，返回空字典")
        return {}
    except json.JSONDecodeError as e:
        print(f"警告：JSON 解析错误 - {e}")
        return {}


def save_json_data(file_path: str, data: Dict[str, Any]) -> bool:
    """保存数据到 JSON 文件
    
    Args:
        file_path: JSON 文件的相对路径
        data: 要保存的字典数据
        
    Returns:
        bool: 保存成功返回 True，否则返回 False
    """
    full_path = os.path.join(Config.BASE_DIR, file_path)
    
    try:
        # 确保目录存在
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        with open(full_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"保存文件失败：{e}")
        return False


def process_chat_input(
    user_input: str, 
    attempt_count: int, 
    max_attempts: int = 3
) -> Dict[str, Any]:
    """处理开场页的用户输入
    
    根据用户输入匹配关键词，返回相应回复
    达到最大尝试次数后自动引导进入下一页面
    
    Args:
        user_input: 用户输入的文字
        attempt_count: 当前尝试次数（从0开始）
        max_attempts: 最大尝试次数
        
    Returns:
        Dict: {
            "response": str,        # 系统回复
            "should_proceed": bool, # 是否应进入下一页面
            "is_final": bool,       # 是否为最终引导语
            "hint": Optional[str],  # 温柔提示
            "matched": bool         # 是否匹配到关键词
        }
    """
    # 清理输入
    cleaned_input = user_input.strip().lower()
    
    # 优先检查关键词匹配（无论尝试次数）
    for keyword in ChatConfig.KEYWORDS.keys():
        if keyword in cleaned_input:
            # 匹配到关键词，返回对应的最终引导消息序列
            final_messages = ChatConfig.FINAL_MESSAGES_BY_KEYWORD.get(
                keyword, 
                ChatConfig.FINAL_MESSAGES  # 如果没有配置，使用默认最终消息
            )
            return {
                "response": final_messages,
                "should_proceed": True,
                "is_final": True,
                "hint": None,
                "matched": True
            }
    
    # 未匹配到关键词，检查是否达到最大尝试次数
    if attempt_count >= max_attempts - 1:
        return {
            "response": ChatConfig.FINAL_MESSAGES,
            "should_proceed": True,
            "is_final": True,
            "hint": None,
            "matched": True  # 最后一次视为"成功"
        }
    
    # 未匹配到关键词，返回默认回复（改为消息序列格式）
    default_response = ChatConfig.DEFAULT_RESPONSES[
        min(attempt_count, len(ChatConfig.DEFAULT_RESPONSES) - 1)
    ]
    
    return {
        "response": default_response,
        "should_proceed": False,
        "is_final": False,  # 设为 False，但前端会根据 response 是否为列表来决定播放方式
        "is_sequence": True,  # 标记为消息序列
        "hint": _get_gentle_hint(attempt_count),
        "matched": False
    }


def _get_gentle_hint(attempt_count: int) -> str:
    """获取温柔的提示信息
    
    根据尝试次数返回递进的提示
    注意：不使用"错误"等否定词
    
    Args:
        attempt_count: 当前尝试次数
        
    Returns:
        str: 温柔的提示语
    """
    hints = [
        "想想今天是什么日子？",
        "和「妈妈」有关哦...",
        "最后一次机会，想想最重要的那个词"
    ]
    return hints[min(attempt_count, len(hints) - 1)]


def validate_password(password: str) -> Dict[str, Any]:
    """验证彩蛋页密码
    
    密码验证不区分大小写
    错误时返回温柔的提示而非否定
    
    Args:
        password: 用户输入的密码
        
    Returns:
        Dict: {
            "success": bool,
            "secret_content": Optional[str],
            "hint": Optional[str],
            "attempts_hint": str  # 鼓励性话语
        }
    """
    cleaned_password = password.strip()
    
    # 验证密码（可以选择是否区分大小写）
    if cleaned_password == SecretConfig.PASSWORD:
        return {
            "success": True,
            "secret_content": SecretConfig.SECRET_CONTENT,
            "hint": None,
            "attempts_hint": "你找到了我们的秘密 ❤️"
        }
    
    # 返回温柔的提示
    import random
    hint = random.choice(SecretConfig.HINTS)
    
    return {
        "success": False,
        "secret_content": None,
        "hint": hint,
        "attempts_hint": "再想想..."
    }


def get_timeline_events() -> List[Dict[str, Any]]:
    """获取时间线事件列表
    
    从配置文件加载并处理时间线数据
    
    Returns:
        List[Dict]: 时间线事件列表，每个事件包含：
            - date: str          # 日期
            - title: str         # 标题
            - description: str   # 描述
            - image: Optional[str]  # 图片路径
            - is_highlighted: bool  # 是否高亮
    """
    timeline_data = load_json_data("data/timeline.json")
    events = timeline_data.get("events", [])
    
    # 确保每个事件都有必需字段
    processed_events = []
    for event in events:
        processed_event = {
            "date": event.get("date", ""),
            "title": event.get("title", ""),
            "description": event.get("description", ""),
            "image": event.get("image"),
            "is_highlighted": event.get("is_highlighted", False),
            "emotion_note": event.get("emotion_note", "")  # 为什么这一刻重要
        }
        processed_events.append(processed_event)
    
    return processed_events


def format_letter_paragraphs(letter_content: str) -> List[str]:
    """将信件内容分割为段落
    
    用于实现信件页的分段展示效果
    
    Args:
        letter_content: 完整的信件内容
        
    Returns:
        List[str]: 分割后的段落列表
    """
    # 按空行分割
    paragraphs = letter_content.strip().split("\n\n")
    
    # 清理每个段落
    return [p.strip() for p in paragraphs if p.strip()]
