export interface Profile {
  id: string
  name: string
  content_topic: string
  personality: string
  target_audience: string
  content_style: string
  platform: string
  created_at: string
}

export interface Script {
  id: string
  user_id: string
  topic: string
  hook: string
  main_content: string
  call_to_action: string
  created_at: string
}
