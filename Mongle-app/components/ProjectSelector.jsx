import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProjectStore } from '../stores';

const ProjectSelector = () => {
  const {
    projects,
    currentProject,
    currentProjectId,
    currentProjectName,
    loading,
    setCurrentProject,
    fetchProjects
  } = useProjectStore();

  const [modalVisible, setModalVisible] = useState(false);

  React.useEffect(() => {
    // 컴포넌트 마운트 시 프로젝트 목록 로드
    if (projects.length === 0) {
      fetchProjects();
    }
  }, []);

  const handleSelectProject = (project) => {
    setCurrentProject(project);
    setModalVisible(false);
  };

  const renderProjectItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.projectItem,
        currentProjectId === item.id && styles.selectedProjectItem
      ]}
      onPress={() => handleSelectProject(item)}
    >
      <View style={styles.projectInfo}>
        <Text style={styles.projectName}>{item.name}</Text>
        <Text style={styles.projectDate}>
          {item.wedding_date ? `결혼일: ${item.wedding_date}` : '결혼일 미정'}
        </Text>
        <Text style={styles.projectStatus}>
          상태: {item.status || 'active'}
        </Text>
      </View>
      {currentProjectId === item.id && (
        <Ionicons name="checkmark-circle" size={24} color="#C9716A" />
      )}
    </TouchableOpacity>
  );

  return (
    <View>
      {/* 현재 선택된 프로젝트 표시 */}
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectorContent}>
          <View style={styles.projectIcon}>
            <Ionicons name="heart" size={20} color="#C9716A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.selectorLabel}>현재 프로젝트</Text>
            <Text style={styles.selectorValue}>
              {currentProjectName || '프로젝트 선택'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#6B5B55" />
        </View>
      </TouchableOpacity>

      {/* 프로젝트 선택 모달 */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>프로젝트 선택</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B5B55" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#C9716A" />
                <Text style={styles.loadingText}>프로젝트 로딩 중...</Text>
              </View>
            ) : projects.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={48} color="#B8A9A5" />
                <Text style={styles.emptyText}>생성된 프로젝트가 없습니다</Text>
                <Text style={styles.emptySubtext}>새 프로젝트를 만들어 보세요</Text>
              </View>
            ) : (
              <FlatList
                data={projects}
                keyExtractor={(item) => item.id}
                renderItem={renderProjectItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  selector: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#2C2420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2EDE8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectorLabel: {
    fontSize: 12,
    color: '#6B5B55',
    marginBottom: 2,
  },
  selectorValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2420',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    minHeight: '40%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2EDE8',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2420',
  },
  closeButton: {
    padding: 4,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B5B55',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2420',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B5B55',
    marginTop: 4,
  },

  listContainer: {
    padding: 20,
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F2EDE8',
    marginBottom: 8,
  },
  selectedProjectItem: {
    backgroundColor: '#FFE8E8',
    borderWidth: 2,
    borderColor: '#C9716A',
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2420',
    marginBottom: 4,
  },
  projectDate: {
    fontSize: 14,
    color: '#6B5B55',
    marginBottom: 2,
  },
  projectStatus: {
    fontSize: 12,
    color: '#7A9E8E',
    fontWeight: '500',
  },
});

export default ProjectSelector;
