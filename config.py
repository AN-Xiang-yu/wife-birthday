"""
生日纪念网站 · 配置文件

包含应用配置、密码设置、内容配置等
请根据实际情况修改这些配置
"""

import os
from typing import Any, List, Dict


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

    # 资源路径（相对于 static 目录）
    TIMELINE_MUSIC_PATH: str = "music/我们的歌.MP3"
    
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

    # 起始页面（1-4 对应开场/时间线/故事放大/信件）
    START_PAGE: int = 1

class ChatConfig:
    """开场页对话配置"""
    
    # 最大尝试次数
    MAX_ATTEMPTS: int = 4
    
    # 关键词匹配规则（可自定义）
    # 格式：{关键词: 回复内容}
    KEYWORDS: Dict[str, str] = {
        "生日": "你已经想到了一个很重要的词。不过，我想说的还不止这些。",
        "礼物": "如果只是礼物，那就太简单了。我准备的东西，没法放进盒子里。",
    }
    
    # 默认回复（未匹配到关键词时）
    DEFAULT_RESPONSES: List[str] = [
        # 第 1 次
        "你现在的语气，让我想起你假装什么都不知道的时候。🙂",
        # 第 2 次
        "给你一个线索吧。这个答案，我们每年都会遇到一次。👀",
        # 第 3 次
       "再提示一下，2000年1月16日，是个特别的日子。🎉"
    ]
    
    # 最终引导语（第3次后自动触发）
    # 改为列表格式，前端会逐条显示
    FINAL_MESSAGES: List[Dict[str, any]] = [
        {"delay": 1000, "text": "其实我早就知道，你是在等我先开口。😌"},
        {"delay": 1800, "text": "那我来说吧。"},
        {"delay": 3000, "text": "有些答案，不在一句话里，而在我们走过的路上。"},
        {"delay": 4500, "text": "我把它们写成了一封信，先点开它，好吗？"}
    ]
    
    FINAL_MESSAGES_BY_KEYWORD: Dict[str, List[Dict[str, Any]]] = {
        # ===== 命中「生日」 =====
        "生日": [
            {"delay": 1000, "text": "其实你一说出这个词，我就笑了一下。🙂"},
            {"delay": 1700, "text": "因为我知道，你一定会想到它。"},
            {"delay": 2400, "text": "但对我来说，这一天从来不只是一个日期。"},
            {"delay": 3100, "text": "我想带你看看，它对我意味着什么。"}
        ],

        # ===== 命中「礼物」 =====
        "礼物": [
            {"delay": 1000, "text": "你果然会想到这个。😌"},
            {"delay": 1700, "text": "不过我得先说一句实话。"},
            {"delay": 2400, "text": "我准备的，不是那种拆开就结束的礼物。"},
            {"delay": 3100, "text": "它藏在一些我们一起走过的瞬间里。"}
        ],
    }



class SecretConfig:
    """彩蛋页密码配置"""
    
    # 正确密码（只有她知道的事）
    # 请修改为你们之间的秘密
    PASSWORD: str = "20250603"
    
    # 密码提示（错误时显示）
    HINTS: List[str] = [
        "就像 今晚月色真美一样",
        "我们通过微信文字说的哦",
        "提示：是我们的第一个'我爱你'哦"
    ]
    
    # 解锁后的隐藏内容
    SECRET_CONTENT: str = """
    其实当你对我说出 “我爱你”之前，我早就在心里演练过无数次，
    但没有想到的是，你首先，顺着我的话，对我说出了那三个字。
    那一刻，我的心跳得很快，很快，很快……
    """

    # 标题打字速度（毫秒/字符）
    TITLE_TYPING_INTERVAL_MS: int = 150

    # 提示打字速度（毫秒/字符）
    HINT_TYPING_INTERVAL_MS: int = 90


class RainEffectConfig:
    """花雨效果配置"""
    
    # 初始花雨数量（页面加载时）
    INITIAL_ITEMS: int = 36
    
    # 最大花雨数量（防止堆积）
    MAX_ITEMS: int = 52
    
    # 花雨生成间隔（毫秒）
    SPAWN_INTERVAL: int = 650


class ContentConfig:
    """内容配置"""
    
    # 她的名字（用于结尾页）
    HER_NAME: str = "亲爱的"
    
    # 生日日期
    BIRTHDAY_DATE: str = "2025年X月X日"
    
    # 你的签名
    YOUR_SIGNATURE: str = "永远爱你的人"


class TypographyConfig:
    """文字排版配置（单位：rem）"""

    # 第 1 页（开场对话）字号
    INTRO_TEXT_SIZE_REM: float = 1.25

    # 第 2 页（时间线）字号
    TIMELINE_TEXT_SIZE_REM: float = 1.25

    # 第 4 页（信件正文/黑色文字）字号
    LETTER_TEXT_SIZE_REM: float = 1.5

    # 第 4 页（信件标题/红色文字）字号
    LETTER_LABEL_SIZE_REM: float = 1.35


class LetterConfig:
    """信件页逐字显示配置"""

    # 打字速度（毫秒/字符）
    TYPING_INTERVAL_MS: int = 1000

    # 段落之间的间隔（毫秒）
    PARAGRAPH_DELAY_MS: int = 10000
