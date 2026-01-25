"""
生日纪念网站 · 配置文件

包含应用配置、密码设置、内容配置等
请根据实际情况修改这些配置
"""

import os
from typing import List, Dict


class Config:
    """应用主配置类"""
    
    # ========== 服务器配置 ==========
    HOST: str = "0.0.0.0"
    PORT: int = 5000
    DEBUG: bool = False  # 生产环境请设为 False
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "your-secret-key-here")
    
    # ========== 路径配置 ==========
    BASE_DIR: str = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR: str = os.path.join(BASE_DIR, "data")
    STATIC_DIR: str = os.path.join(BASE_DIR, "static")
    
    # ========== 页面配置 ==========
    # 页面顺序（情绪节奏）
    PAGE_SEQUENCE: List[str] = [
        "intro",      # 开场页：好奇 → 参与
        "timeline",   # 时间线：回忆
        "moments",    # 故事放大：回忆深化
        "letter",     # 信件页：共鸣
        "secret",     # 彩蛋一：私密感
        "playful",    # 彩蛋二：轻松
        "ending"      # 结尾页：落点
    ]


class ChatConfig:
    """开场页对话配置"""
    
    # 最大尝试次数
    MAX_ATTEMPTS: int = 3
    
    # 关键词匹配规则（可自定义）
    # 格式：{关键词: 回复内容}
    KEYWORDS: Dict[str, str] = {
        "生日": "没错，今天是一个特别的日子...",
        "礼物": "最好的礼物，是我们一起走过的时光",
        "爱": "这个字，我想用接下来的故事告诉你",
        # 添加更多关键词...
    }
    
    # 默认回复（未匹配到关键词时）
    DEFAULT_RESPONSES: List[str] = [
        "嗯...再想想？",
        "差一点点...",
        "让我给你一个提示吧..."
    ]
    
    # 最终引导语（第3次后自动触发）
    FINAL_MESSAGE: str = "好啦，让我带你走进我们的故事..."


class SecretConfig:
    """彩蛋页密码配置"""
    
    # 正确密码（只有她知道的事）
    # 请修改为你们之间的秘密
    PASSWORD: str = "你们的秘密密码"
    
    # 密码提示（错误时显示）
    HINTS: List[str] = [
        "想想我们第一次...的那天",
        "还记得那个只有我们知道的...",
        "提示：和某个特别的日期有关"
    ]
    
    # 解锁后的隐藏内容
    SECRET_CONTENT: str = """
    这是只属于我们的秘密...
    （在这里写下你想对她说的隐藏话语）
    """


class ContentConfig:
    """内容配置"""
    
    # 她的名字（用于结尾页）
    HER_NAME: str = "亲爱的"
    
    # 生日日期
    BIRTHDAY_DATE: str = "2025年X月X日"
    
    # 你的签名
    YOUR_SIGNATURE: str = "永远爱你的人"
