"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";
import byteSize from "byte-size";
import axios from "axios";
import { usePDF } from 'react-to-pdf';

import styles from "@/styles/app/Index.module.css";
import Scroll from "@/components/primitives/Scroll";

const fileTypes: any = {
    acta_constitutiva: "Acta Constitutiva",
    ine: "INE",
    csf: "Constancia de Situación Fiscal",
};

const phaseMapper: any = {
    0: {
        label: 'En espera',
        color: '#737373'
    },
    1: {
        label: 'Carga',
        color: '#F59E0B'
    },
    2: {
        label: 'Extracción',
        color: '#F59E0B'
    },
    3: {
        label: 'Análisis',
        color: '#F59E0B'
    },
    4: {
        label: 'Terminado',
        color: '#16A34A'
    }
}

export default function Index() {
    const [dictum, setDictum] = useState<any>();
    const [numPages, setNumPages] = useState<number>();
    const [processing, setProcessing] = useState(false);
    const [uploads, setUploads] = useState<any>();
    const [modal, setModal] = useState<any>();
    const [progress, setProgress] = useState(0);

    const { toPDF, targetRef } = usePDF({ filename: 'page.pdf' });

    const submitHandler = async () => {
        const formData = new FormData();
        setProcessing(true);
        
        // Enviar cada archivo con su tipo correspondiente
        Object.keys(uploads).forEach(id => {
            const file = uploads[id].file;
            const type = uploads[id].type;
    
            if (file && type && type !== 'none') {
                formData.append("files", file);
                formData.append("doc_types", type);
            }
        });
    
        try {
            const response = await axios.post('http://127.0.0.1:8004/ocr', formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                },
                onUploadProgress: (progressEvent) => {
    if (progressEvent.total) {
        setProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
    }
},
            });
    
            console.log(response.data);
            // Manejar la respuesta de la API aquí, por ejemplo, mostrando los resultados en el frontend
            setDictum(response.data.responses);
        } catch (error) {
            console.error("Error al enviar archivos:", error);
        } finally {
            setProcessing(false);
            setProgress(0);
        }
    };

    useEffect(() => {
        console.log('Uploads: ', uploads);
    }, [uploads])

    useEffect(() => {
        console.log('Dictum: ', dictum);
    }, [dictum])

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.S1Container}>
                    <div className={styles.S1Header}>
                        <svg
                            className={styles.S1Svg}
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="current"
                            stroke="current"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                            />
                        </svg>
                        <p className={styles.S1Title}>Carga de archivos</p>
                    </div>
                    <div className={styles.S1Content}>
                        <div className={styles.S1Input}>
                            <svg className={styles.S1InputSvg} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="current" stroke="current"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                            <p className={styles.S1InputLabel}>Arrastra o selecciona algún archivo para continuar</p>
                            <input
                                className={styles.S1InputField}
                                onChange={(e) => {
                                    if (e.target.files) {
                                        setUploads((prevUploads: any) => {
                                            const index: any = { ...prevUploads }

                                            Array.from(e.target.files!).map((file) => {
                                                index[uuidv4()] = {
                                                    file,
                                                    type: "none",
                                                    phase: 0,
                                                    progress: 0,
                                                    data: {}
                                                }
                                            })

                                            return index;
                                        })
                                    }
                                }}
                                multiple
                                type="file"
                                name="file"
                                id="file"
                                disabled={processing}
                            />
                        </div>
                        <div className={styles.S1Files}>
                        { uploads && Object.keys(uploads).map(id => 
                            <div className={styles.S1File} key={id}>
                                <div className={styles.S1FileHeader}>
                                    <p className={styles.S1FileName}>{uploads[id].file.name}</p>
                                    <select 
                                        className={styles.S1FileTypes} 
                                        onChange={e => setUploads((prevUploads: any) => ({
                                            ...prevUploads,
                                            [id]: {
                                                ...prevUploads[id],
                                                type: e.target.value
                                            }
                                        }))}
                                        disabled={processing}
                                    >
                                        <option className={styles.S1FileType} value="none">Selecciona</option>
                                        <option className={styles.S1FileType} value="acta_constitutiva">Acta constitutiva</option>
                                        <option className={styles.S1FileType} value="csf">Constancia de situación fiscal</option>
                                        <option className={styles.S1FileType} value="ine">Identificación</option>
                                    </select>
                                </div>
                                <div className={styles.S1FileProgress}>
                                    <motion.div className={styles.S1ProgressBar}
                                        initial={{ width: 0, backgroundColor: '#DC2626' }}
                                        animate={{ width: `${uploads[id].progress}%`, backgroundColor: phaseMapper[uploads[id].phase].color }}
                                        transition={{ duration: 1 }}
                                    />
                                </div>
                                <div className={styles.S1FileFooter}>
                                    <p className={styles.S1FileType}>{uploads[id].file.type.split('/')[uploads[id].file.type.split('/').length - 1]} - {byteSize(uploads[id].file.size).value} {byteSize(uploads[id].file.size).unit}</p>
                                    <div className={styles.S1FilePhase}>
                                        { uploads[id].phase === 0 && <div className={`${styles.S1PhaseDot} bg-[#737373]`}/> }
                                        { uploads[id].phase === 1 && <div className={`${styles.S1PhaseDot} bg-[#F59E0B]`}/> }
                                        { uploads[id].phase === 2 && <div className={`${styles.S1PhaseDot} bg-[#F59E0B]`}/> }
                                        { uploads[id].phase === 3 && <div className={`${styles.S1PhaseDot} bg-[#F59E0B]`}/> }
                                        { uploads[id].phase === 4 && <div className={`${styles.S1PhaseDot} bg-[#22C55E]`}/> }
                                        { uploads[id].phase === 0 && <p className={`${styles.S1PhaseLabel} text-[#737373]`}>{phaseMapper[uploads[id].phase].label}</p> }
                                        { uploads[id].phase === 1 && <p className={`${styles.S1PhaseLabel} text-[#F59E0B]`}>{phaseMapper[uploads[id].phase].label}</p> }
                                        { uploads[id].phase === 2 && <p className={`${styles.S1PhaseLabel} text-[#F59E0B]`}>{phaseMapper[uploads[id].phase].label}</p> }
                                        { uploads[id].phase === 3 && <p className={`${styles.S1PhaseLabel} text-[#F59E0B]`}>{phaseMapper[uploads[id].phase].label}</p> }
                                        { uploads[id].phase === 4 && <p className={`${styles.S1PhaseLabel} text-[#22C55E]`}>{phaseMapper[uploads[id].phase].label}</p> }
                                    </div>
                                </div>
                            </div>) }
                        </div>
                        <button
                            className={styles.submit}
                            onClick={(e) => {
                                submitHandler();
                            }}
                            disabled={processing}
                        >
                            {processing ? "Procesando..." : "Procesar"}
                        </button>
                        {processing && (
                            <div className={styles.loadingBar}>
                                <div className={styles.loadingProgress} style={{ width: `${progress}%` }}>
                                    {progress}%
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className={styles.S1Container}>
                    <div className={styles.S1Header}>
                        <svg
                            className={styles.S1Svg}
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="current"
                            stroke="current"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z"
                            />
                        </svg>
                        <p className={styles.S1Title}>
                            Procesamiento de información
                        </p>
                    </div>
                    <div className={styles.S1Content}>
                        { processing && (
                            <div className={styles.processing}>
                                <p className={styles.processingLabel}>
                                    Procesando...
                                </p>
                                <div className={styles.processingSvg}>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth="current"
                                        stroke="current"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                                        />
                                    </svg>
                                </div>
                            </div>
                        )}
                        <div className={styles.questions}>
                            {dictum &&
                                Object.keys(dictum).map((param) => {
                                    return (
                                        <motion.div
                                            className={styles.questionContainer}
                                            initial={{ y: 25, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ duration: 1 }}
                                            key={param}
                                        >
                                            <svg
                                                className={styles.questionSvg}
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="current"
                                                stroke="current"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                                                />
                                            </svg>
                                            <div
                                                className={styles.questionText}
                                            >
                                                <p
                                                    className={
                                                        styles.questionTitle
                                                    }
                                                >
                                                    {dictum[param].question}
                                                </p>
                                                <p
                                                    className={
                                                        styles.questionResponse
                                                    }
                                                >
                                                    {dictum[param].answer
                                                        ? dictum[param].answer
                                                        : "No disponible"}
                                                </p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                        </div>
                    </div>
                </div>
                <div className={styles.S1Container}>
                    <div className={styles.S1Header}>
                        <svg
                            className={styles.S1Svg}
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="current"
                            stroke="current"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3"
                            />
                        </svg>
                        <p className={styles.S1Title}>Resultados</p>
                    </div>
                    <div className={styles.S1Content}>
                        { dictum && <motion.div
                            className={styles.S3Item}
                            onClick={() => { setModal(true) }}
                            initial={{ y: 25, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 1 }}
                        >
                            {/* Tipo de empresa, nombre de empresa, boton de descargar, fecha - Tags (documentos subidos) */}
                            <div className={styles.S3ItemHeader}>
                                <div className={styles.S3HeaderText}>
                                    <p className={styles.S3ItemType}>{dictum[0].content.sociedad?.answer || 'Sociedad por definir'}</p>
                                    <p className={styles.S3ItemName}>{dictum[0].content.empresa?.answer || 'Empresa por definir'}</p>
                                    <div className={styles.S3ItemFade} />
                                </div>
                                <button className={styles.S3HeaderButton}>
                                    <svg className={styles.S3ButtonSvg} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="current" stroke="current"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                </button>
                            </div>
                            <div className={styles.S3ItemFooter}>
                                <p className={styles.S3FooterTag}>Acta constitutiva</p>
                                {/* <p className={styles.S3FooterTag}>Identificación</p>
                                <p className={styles.S3FooterTag}>Constancia de situación fiscal</p> */}
                                <div className={styles.S3ItemFade} />
                            </div>
                        </motion.div> }
                        <AnimatePresence>
                            { modal && <motion.div className={styles.S3ModalContainer}>
                                <motion.div
                                    className={styles.S3ModalBackground}
                                    onClick={() => { setModal(false) }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                    exit={{ opacity: 0 }}
                                />
                                <motion.div
                                    className={styles.S3ModalContent}
                                    initial={{ y: 200, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 0.5, ease: 'backInOut' }}
                                    exit={{ y: 200, opacity: 0 }}
                                >
                                    <div className={styles.S3DocumentContainer}>
                                        <div className={styles.S3DocumentOptions}>
                                            <div className={styles.S3OptionsText}>
                                                <p className={styles.S3OptionsType}></p>
                                                <p className={styles.S3OptionsName}></p>
                                                <div className={styles.S3OptionsFade} />
                                            </div>
                                            <button className={styles.S3OptionsDownload} onClick={() => toPDF()}>
                                                <svg className={styles.S3DownloadSvg} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="current" stroke="current"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                                <p className={styles.S3DownloadLabel}>Descargar</p>
                                            </button>
                                        </div>
                                        <Scroll>
                                            <div className={styles.Document} ref={targetRef}>
                                                <div className={styles.DocumentHeader}>
                                                    <div className={styles.HeaderPreface}>
                                                    <p className={styles.PrefaceLabel}>Dictaminación</p>
                                                    </div>
                                                </div>
                                                <div className={styles.DocumentContent}>
                                                    <div className={styles.DocumentSection}>
                                                        <p className={styles.SectionTitle}>Resumen</p>
                                                        <div className={styles.SectionRow}>
                                                            <p className={styles.RowCategory}>RFC</p>
                                                            <p className={styles.RowData}>{dictum[0].content.rfc?.answer || 'No disponible'}</p>
                                                        </div>
                                                        <div className={styles.SectionRow}>
                                                            <p className={styles.RowCategory}>Estatus en el padrón</p>
                                                            <p className={styles.RowData}>{dictum[0].content.estatus?.answer || 'No disponible'}</p>
                                                        </div>
                                                        <div className={styles.SectionRow}>
                                                            <p className={styles.RowCategory}>Actividad económica principal</p>
                                                            <p className={styles.RowData}>{dictum[0].content.actividad?.answer || 'No disponible'}</p>
                                                        </div>
                                                        <div className={styles.SectionRow}>
                                                            <p className={styles.RowCategory}>Nombre de la empresa</p>
                                                            <p className={styles.RowData}>{dictum[0].content.empresa?.answer || 'No disponible'}</p>
                                                        </div>
                                                        <div className={styles.SectionRow}>
                                                            <p className={styles.RowCategory}>Socios de la empresa</p>
                                                            <p className={styles.RowData}>{dictum[0].content.shareholders?.answer || 'No disponible'}</p>
                                                        </div>
                                                        <div className={styles.SectionRow}>
                                                            <p className={styles.RowCategory}>Representante legal de la empresa</p>
                                                            <p className={styles.RowData}>{dictum[0].content.representative?.answer || 'No disponible'}</p>
                                                        </div>
                                                        <div className={styles.SectionRow}>
                                                            <p className={styles.RowCategory}>Accionistas</p>
                                                            <p className={styles.RowData}>{dictum[0].content.accionistas?.answer || 'No disponible'}</p>
                                                        </div>
                                                        <div className={styles.SectionRow}>
                                                            <p className={styles.RowCategory}>Representantes</p>
                                                            <p className={styles.RowData}>{dictum[0].content.representantes?.answer || 'No disponible'}</p>
                                                        </div>
                                                        <div className={styles.SectionRow}>
                                                            <p className={styles.RowCategory}>Facultades</p>
                                                            <p className={styles.RowData}>{dictum[0].content.facultades?.answer || 'No disponible'}</p>
                                                        </div>
                                                        <div className={styles.SectionRow}>
                                                            <p className={styles.RowCategory}>Fecha de constitución</p>
                                                            <p className={styles.RowData}>{dictum[0].content.fecha?.answer || 'No disponible'}</p>
                                                        </div>
                                                        <div className={styles.SectionRow}>
                                                            <p className={styles.RowCategory}>Duración de la empresa</p>
                                                            <p className={styles.RowData}>{dictum[0].content.duracion?.answer || 'No disponible'}</p>
                                                        </div>
                                                        <div className={styles.SectionRow}>
                                                            <p className={styles.RowCategory}>Folio mercantil</p>
                                                            <p className={styles.RowData}>{dictum[0].content.folio?.answer || 'No disponible'}</p>
                                                        </div>
                                                        <div className={styles.SectionRow}>
                                                            <p className={styles.RowCategory}>Tipo de sociedad</p>
                                                            <p className={styles.RowData}>{dictum[0].content.sociedad?.answer || 'No disponible'}</p>
                                                        </div>
                                                        <div className={styles.SectionRow}>
                                                            <p className={styles.RowCategory}>Acta</p>
                                                            <p className={styles.RowData}>{dictum[0].content.acta?.answer || 'No disponible'}</p>
                                                        </div>
                                                        <div className={styles.SectionRow}>
                                                            <p className={styles.RowCategory}>Notaría de constitución</p>
                                                            <p className={styles.RowData}>{dictum[0].content.notaria?.answer || 'No disponible'}</p>
                                                        </div>
                                                        <div className={styles.SectionRow}>
                                                            <p className={styles.RowCategory}>Notario de constitución</p>
                                                            <p className={styles.RowData}>{dictum[0].content.notario?.answer || 'No disponible'}</p>
                                                        </div>
                                                        <div className={styles.SectionRow}>
                                                            <p className={styles.RowCategory}>Domicilio comercial</p>
                                                            <p className={styles.RowData}>{dictum[0].content.comercial?.answer || 'No disponible'}</p>
                                                        </div>
                                                        <div className={styles.SectionRow}>
                                                            <p className={styles.RowCategory}>Domicilio legal</p>
                                                            <p className={styles.RowData}>{dictum[0].content.legal?.answer || 'No disponible'}</p>
                                                        </div>
                                                        <div className={styles.SectionRow}>
                                                            <p className={styles.RowCategory}>Crédito</p>
                                                            <p className={styles.RowData}>{dictum[0].content.credito?.answer || 'No disponible'}</p>
                                                        </div>
                                                        <div className={styles.SectionRow}>
                                                            <p className={styles.RowCategory}>Socios</p>
                                                            <p className={styles.RowData}>{dictum[0].content.socios?.answer || 'No disponible'}</p>
                                                        </div>
                                                        <div className={styles.SectionRow}>
                                                            <p className={styles.RowCategory}>Firmantes</p>
                                                            <p className={styles.RowData}>{dictum[0].content.firmantes?.answer || 'No disponible'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Scroll>
                                    </div>
                                </motion.div>
                            </motion.div> }
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
