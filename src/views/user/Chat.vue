<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const messages = ref([]);
const newMessage = ref('');
const selectedConversation = ref(null);

const conversations = ref([
    { name: 'Agent', lastMessage: '.', time: '16m', img: 'https://i.pravatar.cc/100?u=ricky' },
]);

// WebSocket reference
let socket = null;

const truncateMessage = (message, maxLength = 40) => {
    return message.length > maxLength ? message.slice(0, maxLength) + '...' : message;
};

function connectWebSocket() {
    socket = new WebSocket('ws://localhost:9090/ws');

    socket.onopen = () => {
        console.log('WebSocket connected');
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        messages.value.push({
            content: data.content,
            sender: data.sender,
            timestamp: new Date(data.timestamp).toLocaleTimeString(),
        });
    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
        console.log('WebSocket closed, reconnecting...');
        setTimeout(connectWebSocket, 1000);
    };
}

function sendMessage() {
    if (newMessage.value.trim() !== '' && socket) {
        const msg = {
            sender: 'user',
            recipient: selectedConversation.value.name,
            content: newMessage.value,
        };

        socket.send(JSON.stringify(msg));

        newMessage.value = '';
    }
}


function selectConversation(conversation) {
    selectedConversation.value = conversation;
    const conversationId = conversation.name;

    fetch(`http://localhost:9090/get_message/${conversationId}`)
        .then((res) => {
            if (!res.ok) {
                throw new Error('Failed to fetch messages');
            }
            return res.json();
        })
        .then((data) => {
            messages.value = data.messages.map((msg) => ({
                content: msg.content,
                sender: msg.sender,
                timestamp: new Date(msg.timestamp).toLocaleTimeString(),
            }));
        })
        .catch((err) => {
            console.error('Error fetching messages:', err);
        });
}


onMounted(() => {
    if (conversations.value.length > 0) {
        selectedConversation.value = conversations.value[0];
    }
    connectWebSocket();
});

onUnmounted(() => {
    if (socket) {
        socket.close();
    }
});
</script>


<template>
    <div class="flex flex-col md:flex-row gap-8">
        <!-- Conversation List (Scrollable) -->
        <div class="md:w-1/2 flex flex-col h-[620px] border border-gray-300 rounded-lg shadow-md">
            <div class="bg-blue-500 text-white font-semibold text-xl p-4 rounded-t-lg">Chat</div>
            <div class="p-4 bg-white">
                <input
                    type="text"
                    placeholder="Search Messenger"
                    class="w-full p-2 rounded-lg border border-gray-300"
                />
            </div>
            <!-- Scrollable conversation list -->
            <div class="overflow-y-auto flex-grow max-h-[520px]">
                <div
                    v-for="(conversation, index) in conversations"
                    :key="index"
                    @click="selectConversation(conversation)"
                    :class="['p-4 border-b cursor-pointer', 
                             selectedConversation === conversation ? 'bg-blue-200' : 'hover:bg-gray-200']"
                >
                    <div class="flex items-center gap-4">
                        <!-- Profile Image -->
                        <img :src="conversation.img" alt="Profile image" class="w-10 h-10 rounded-full bg-gray-300" />
                        <div>
                            <p class="font-semibold">{{ conversation.name }}</p>
                            <p class="text-sm text-gray-500">{{ truncateMessage(conversation.lastMessage) }}</p>
                        </div>
                        <div class="ml-auto text-sm text-gray-500">{{ conversation.time }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Chat Window - Only displayed if a conversation is selected -->
        <div v-if="selectedConversation" class="md:w-full flex flex-col h-[620px] border border-gray-300 rounded-lg shadow-md">
            <div class="bg-blue-500 text-white font-semibold text-xl p-4 rounded-t-lg">{{ selectedConversation.name }}</div>
            <div class="flex-grow p-4 overflow-y-auto space-y-4">
                <!-- Messages Loop -->
                <div v-for="(msg, index) in messages" :key="index" class="flex flex-col space-y-1">
                    <div v-if="msg.sender === 'user'" class="self-end bg-blue-500 text-white p-2 rounded-lg max-w-xs">
                        <p>{{ msg.content }}</p>
                        <span class="text-xs text-right block">{{ msg.timestamp }}</span>
                    </div>
                    <div v-else class="self-start bg-gray-300 p-2 rounded-lg max-w-xs">
                        <p>{{ msg.content }}</p>
                        <span class="text-xs text-right block">{{ msg.timestamp }}</span>
                    </div>
                </div>
            </div>

            <!-- Message Input -->
            <div class="p-4 border-t border-gray-200 flex items-center gap-4">
                <InputText v-model="newMessage" placeholder="Type a message" class="flex-grow" />
                <Button label="Send" @click="sendMessage" :disabled="newMessage === ''" class="bg-blue-500 text-white" />
            </div>
        </div>
    </div>
</template>

<style scoped>
h1 {
    color: #4A5568;
    margin-bottom: 1.5rem;
}
</style>
