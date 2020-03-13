import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Card, Tooltip, Typography, notification } from "antd";
import { QuestionOutlined, CloseOutlined, CheckOutlined } from "@ant-design/icons";
import KintoClient from "kinto-http";
import { useLocalStorage } from "./hooks";

const { Text, Title } = Typography;

const Wrapper = styled.div`
    width: 100%;
    display: flex;
    justify-content: center;
    /* height: 100vh; */
    align-items: center;
`;

const client = new KintoClient("https://kinto.minsky.cc/v1");
const booksCollection = client.bucket("Carlos").collection("books");

const BATCH_SIZE = 3233;

function App() {
    const [lastIndex, setLastIndex] = useLocalStorage("last_index", -1);
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndexBook, setCurrentIndexBook] = useState(lastIndex);

    // const [nextBatch, setNextBatch] = useState(null);

    let nextBooksBatch = null;
    useEffect(() => {
        booksCollection
            .listRecords({ sort: "title", limit: BATCH_SIZE })
            .then(result => {
                console.log(result);
                nextBooksBatch = result.next;
                setBooks(result.data);
                setCurrentIndexBook(0);
            })
            .catch(err => {
                console.log(err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const newBatch = () => {
        console.log(nextBooksBatch);
        setLoading(true);
        nextBooksBatch()
            .then(result => {
                setBooks(result.data);
                setCurrentIndexBook(0);
            })
            .catch(err => {
                console.log(err);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const onNext = () => {
        if (currentIndexBook > BATCH_SIZE - 2) {
            return newBatch();
        }
        const nextIndex = currentIndexBook + 1;
        setCurrentIndexBook(nextIndex);
    };

    const onClassify = type => {
        console.log(books[currentIndexBook].id, type);
        const book = { ...books[currentIndexBook], is_biography: type };
        booksCollection
            .updateRecord(book)
            .then(response => {
                let message = "";
                if (response.data.is_biography === "yes") {
                    message = "The book was saved as a biography";
                } else if (response.data.is_biography === "no") {
                    message = 'Last book was saved as a "NO biography" ';
                } else if (response.data.is_biography === "unknown") {
                    message = "The book was saved as a unknown";
                }

                notification.info({
                    message: `Updated: ${response.data.title}`,
                    description: message,
                    placement: "topRight",
                    duration: 1
                });
                onNext();
            })
            .catch(err => console.log(err));
    };

    console.log(currentIndexBook);
    const currentBook = currentIndexBook >= 0 ? books[currentIndexBook] : {};
    return (
        <Wrapper>
            <div style={{ display: "flex", flexFlow: "column", marginTop: "4rem" }}>
                <Title>Books Collection</Title>
                {loading && <Text type="secondary">Loading</Text>}
                {books.length !== 0 && <Text>Total books: {books.length}</Text>}
                {currentIndexBook !== -1 && <Text>Current book number: {currentIndexBook + 1}</Text>}
                <Card
                    title={currentBook.title}
                    extra={
                        <a href="#" onClick={onNext}>
                            Next
                        </a>
                    }
                    style={{ width: 800, marginTop: "1rem" }}
                    loading={loading}
                    actions={[
                        <Tooltip placement="top" title={"Yes, looks like a biography"}>
                            <CheckOutlined
                                key="yes"
                                onClick={() => onClassify("yes")}
                                style={{ color: currentBook.is_biography === "yes" ? "#1890ff" : "#8a8a8a" }}
                            />
                        </Tooltip>,

                        <Tooltip placement="top" title={"No, it doesn't look like a biography"}>
                            <CloseOutlined
                                key="no"
                                onClick={() => onClassify("no")}
                                style={{ color: currentBook.is_biography === "no" ? "#1890ff" : "#8a8a8a" }}
                            />
                        </Tooltip>,
                        <Tooltip placement="top" title={"I don't Know, I'm not sure"}>
                            <QuestionOutlined
                                key="unknown"
                                onClick={() => onClassify("unknown")}
                                style={{ color: currentBook.is_biography === "unknown" ? "#1890ff" : "#8a8a8a" }}
                            />
                        </Tooltip>
                    ]}
                >
                    <Text strong>Author</Text> <br />
                    <Text>{currentBook.author}</Text> <br /> <br />
                    <Text strong>ISBN</Text> <br />
                    <Text>{currentBook.isbn}</Text> <br /> <br />
                    <Text strong>Synopsis</Text> <br />
                    <Text>{currentBook.synopsis}</Text> <br />
                    <br />
                    <Text strong>Looks like a biography?</Text>
                </Card>
            </div>
        </Wrapper>
    );
}

export default App;
