# Skill Routing

The project uses a business Skill, not a user-selected provider model. A Skill is stored as
`aigc_feature_config.feature_code` and is versioned with the project schema and source code.
GitHub stores the implementation and this contract; the active model, price, and enable switch
are managed in the admin console and stored in MySQL.

| User-facing feature | Skill code | Required model capability |
| --- | --- | --- |
| General copywriting | `copywriting` / `general` | `chat` |
| Spoken video script | `spoken_copy` | `chat` |
| Viral spoken video script | `viral_spoken_copy` | `chat` |
| Xiaohongshu note | `xiaohongshu_note` | `chat` |
| Rewrite and polish | `rewrite` | `chat` |
| Title generation | `title` | `chat` |
| Translation | `translate` | `chat` |
| Emotional copy | `emotion` | `chat` |
| Humorous poem | `poem` | `chat` |
| Lyrics | `lyrics` | `chat` |
| Long-form writing | `writing` | `chat` |
| Marketing copy | `marketing` | `chat` |
| Style imitation | `imitate` | `chat` |
| Copy extraction | `extract` | `chat` |
| AI drawing | `image` | `draw` |
| AI video | `video` | `video` |
| AI music | `music` | `music` |
| Voice clone | `voice_clone` | `audio` |
| Avatar clone | `avatar_clone` | `digital_human` |
| Face merge | `face_merge` | `face_merge` |
| Photo digital human | `photo_dh` | `digital_human` |

Routing order: the configured primary model is used when it is enabled and supports the Skill's
capability. Otherwise the lowest-cost enabled model with that capability is selected. If none is
available, the request is rejected before charging the user.
