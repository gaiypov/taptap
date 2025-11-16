export interface ChatThread {
    id: string;
    listing_id: string;
    buyer_id: string;
    seller_id: string;
    last_message_at: string;
    created_at: string;
    listing?: {
        id: string;
        title: string;
        price: number;
        currency: string;
        thumbnail_url?: string;
    };
    buyer?: {
        id: string;
        name: string;
        avatar_url?: string;
    };
    seller?: {
        id: string;
        name: string;
        avatar_url?: string;
    };
    unread_count: number;
}
export interface ChatMessage {
    id: string;
    thread_id: string;
    sender_id: string;
    body: string;
    created_at: string;
    read_at: string | null;
    sender?: {
        id: string;
        name: string;
        avatar_url?: string;
    };
}
//# sourceMappingURL=chat.types.d.ts.map